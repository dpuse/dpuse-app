// Lists and removes what the app keeps in this browser: local storage, session storage, IndexedDB databases and the
// origin private file system (OPFS). The browser shows the app only its own origin's storage, so nothing another site
// keeps is listed or removed.

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface BrowserStorageSnapshot {
    estimate: StorageEstimateSummary | undefined; // Undefined where the browser cannot estimate its storage.
    indexedDatabases: IndexedDatabaseSummary[];
    localStorageItems: LocalStorageItemSummary[];
    opfsItems: OpfsItemSummary[] | undefined; // Undefined where the browser has no OPFS.
}

// Only Chromium breaks usage down by kind of storage, so the two kinds are undefined in other browsers.
export interface StorageEstimateSummary {
    fileSystemUsage: number | undefined;
    indexedDatabaseUsage: number | undefined;
    quota: number | undefined;
    usage: number | undefined;
}

export interface LocalStorageItemSummary {
    key: string;
    size: number;
    value: string;
}

export interface IndexedDatabaseSummary {
    name: string;
    version: number;
}

// Something in OPFS that can be removed safely on its own. Files are grouped into what they make up, such as a DuckDB
// database and its write-ahead logs, because removing one file of a group would damage the rest.
export interface OpfsItemSummary {
    id: string;
    lastModified: number | undefined; // The latest of its files. Undefined when any of them cannot be read.
    name: string; // The DuckDB database's name, or the path of anything else.
    removalPaths: string[]; // The files and folders removed together.
    size: number | undefined; // Undefined when any of its files cannot be read.
    typeId: OpfsItemTypeId;
}

// In the order the list shows them.
export type OpfsItemTypeId = 'sqlitePool' | 'duckdbDatabase' | 'duckdbTemporaryFiles' | 'other';

interface OpfsFileSummary {
    lastModified: number | undefined; // Undefined when the file cannot be read, as when SQLite or DuckDB holds it open.
    path: string;
    size: number | undefined;
}

// Where an OPFS file belongs: the item it is part of, and what removing that item removes.
interface OpfsFilePlacement {
    id: string;
    name: string;
    removalPath: string;
    typeId: OpfsItemTypeId;
}

// Chromium adds 'usageDetails' to the estimate. The DOM types do not include it, because no other browser has it.
interface ChromiumStorageEstimate extends StorageEstimate {
    usageDetails?: { fileSystem?: number; indexedDB?: number };
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── OPFS Layout ─ The folders the SQLite and DuckDB connectors keep their files in. Only these are looked inside,
// because the app knows which of their files belong together. Anything else is listed as its top-level entry.
const SQLITE_POOL_FOLDER = '.dpuse-connector-sqlite-wasm'; // SQLite names the pool's files at random, so only SQLite can tell its databases apart.
const DUCKDB_FOLDER = 'duckdb';
const DUCKDB_SCRATCH_FOLDER = 'duckdb/scratch'; // Temporary files of a running DuckDB, which the connector removes when DuckDB starts and stops.
const DUCKDB_DATABASE_FILE_PATTERN = /^duckdb\/fs\/([^/]+)\.duckdb(?:\.wal|\.wal\.checkpoint|\.wal\.recovery)?$/u; // A database's file and its write-ahead logs.
const OPFS_ITEM_TYPE_IDS: OpfsItemTypeId[] = ['sqlitePool', 'duckdbDatabase', 'duckdbTemporaryFiles', 'other'];

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function retrieveBrowserStorageSnapshot(): Promise<BrowserStorageSnapshot> {
    const [estimate, indexedDatabases, opfsItems] = await Promise.all([retrieveStorageEstimate(), listIndexedDatabases(), listOpfsItems()]);
    return { estimate, indexedDatabases, localStorageItems: listLocalStorageItems(), opfsItems };
}

// ── Local Storage
export function removeLocalStorageItem(key: string): void {
    localStorage.removeItem(key);
}

export function clearLocalStorage(): void {
    localStorage.clear();
}

// ── IndexedDB ─ A delete waits while another connection to the database is open. The browser asks that connection to
// close, and Dexie and TinyBase both do. A connection that stays open blocks the delete, which then fails here, but the
// browser still deletes the database once that connection closes.
export function removeIndexedDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase(name);
        request.addEventListener('success', () => {
            resolve();
        });
        request.addEventListener('error', () => {
            reject(new AppError(`Failed to delete IndexedDB database '${name}'.`, 'dpuse-app._browserStorage.removeIndexedDatabase', undefined, { cause: request.error }));
        });
        request.addEventListener('blocked', () => {
            reject(new AppError(`IndexedDB database '${name}' is in use. Reload the app and try again.`, 'dpuse-app._browserStorage.removeIndexedDatabase.blocked'));
        });
    });
}

// ── OPFS ─ A file that SQLite or DuckDB holds open cannot be removed until the engine closes it, which a reload does.
export async function removeOpfsItem(item: OpfsItemSummary): Promise<void> {
    const root = await navigator.storage.getDirectory();
    for (const path of item.removalPaths) {
        const segments = path.split('/');
        const entryName = segments.pop() ?? '';
        let directory = root;
        for (const segment of segments) directory = await directory.getDirectoryHandle(segment);
        await directory.removeEntry(entryName, { recursive: true });
    }
}

// ── Everything ─ Every store is tried even when one fails, so as much as possible is removed. The failures are
// thrown together afterwards.
export async function clearBrowserStorage(): Promise<void> {
    localStorage.clear();
    sessionStorage.clear();
    const databases = await listIndexedDatabases();
    const results = await Promise.allSettled([...databases.map(({ name }) => removeIndexedDatabase(name)), clearOpfs()]);
    const errors = results.flatMap((result) => (result.status === 'rejected' ? [result.reason as unknown] : []));
    if (errors.length > 0) throw new AggregateError(errors, 'Failed to remove some data from this browser.');
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// 'navigator.storage' is missing outside a secure context, such as a plain 'http' address other than 'localhost'.
function findStorageManager(): StorageManager | undefined {
    return (navigator as Partial<Navigator>).storage;
}

async function retrieveStorageEstimate(): Promise<StorageEstimateSummary | undefined> {
    const storageManager = findStorageManager();
    if (!storageManager) return;

    const estimate: ChromiumStorageEstimate = await storageManager.estimate();
    return { fileSystemUsage: estimate.usageDetails?.fileSystem, indexedDatabaseUsage: estimate.usageDetails?.indexedDB, quota: estimate.quota, usage: estimate.usage };
}

// The size is an estimate: two bytes for each character of the key and value, as browsers count local storage against
// its limit.
function listLocalStorageItems(): LocalStorageItemSummary[] {
    return Object.keys(localStorage)
        .map((key) => {
            const value = localStorage.getItem(key) ?? '';
            return { key, size: (key.length + value.length) * 2, value };
        })
        .toSorted((left, right) => left.key.localeCompare(right.key));
}

// Firefox before 126 cannot list its databases, so there is nothing to show there.
async function listIndexedDatabases(): Promise<IndexedDatabaseSummary[]> {
    if (typeof indexedDB === 'undefined' || typeof indexedDB.databases !== 'function') return [];

    const databaseInfos = await indexedDB.databases();
    return databaseInfos
        .filter((databaseInfo): databaseInfo is IDBDatabaseInfo & { name: string } => databaseInfo.name != null)
        .map(({ name, version = 0 }) => ({ name, version }))
        .toSorted((left, right) => left.name.localeCompare(right.name));
}

async function listOpfsItems(): Promise<OpfsItemSummary[] | undefined> {
    const storageManager = findStorageManager();
    if (typeof storageManager?.getDirectory !== 'function') return;

    const files = await collectOpfsFiles(await storageManager.getDirectory(), '');
    const itemsById = new Map<string, OpfsItemSummary>();
    for (const file of files) {
        const { id, name, removalPath, typeId } = placeOpfsFile(file.path);
        const item = itemsById.get(id);
        if (item) {
            item.lastModified = item.lastModified == null || file.lastModified == null ? undefined : Math.max(item.lastModified, file.lastModified);
            item.size = item.size == null || file.size == null ? undefined : item.size + file.size;
            if (!item.removalPaths.includes(removalPath)) item.removalPaths.push(removalPath);
        } else {
            itemsById.set(id, { id, lastModified: file.lastModified, name, removalPaths: [removalPath], size: file.size, typeId });
        }
    }
    return Array.from(itemsById, ([, item]) => item).toSorted(
        (left, right) => OPFS_ITEM_TYPE_IDS.indexOf(left.typeId) - OPFS_ITEM_TYPE_IDS.indexOf(right.typeId) || left.name.localeCompare(right.name)
    );
}

// Inside the connectors' folders, a file the app does not recognise is listed alone, because removing the whole folder
// would remove the databases beside it.
function placeOpfsFile(path: string): OpfsFilePlacement {
    if (path.startsWith(`${SQLITE_POOL_FOLDER}/`)) return { id: 'sqlitePool', name: SQLITE_POOL_FOLDER, removalPath: SQLITE_POOL_FOLDER, typeId: 'sqlitePool' };
    if (path.startsWith(`${DUCKDB_SCRATCH_FOLDER}/`)) return { id: 'duckdbTemporaryFiles', name: DUCKDB_SCRATCH_FOLDER, removalPath: DUCKDB_SCRATCH_FOLDER, typeId: 'duckdbTemporaryFiles' };
    const databaseName = DUCKDB_DATABASE_FILE_PATTERN.exec(path)?.[1];
    if (databaseName != null) return { id: `duckdbDatabase:${databaseName}`, name: databaseName, removalPath: path, typeId: 'duckdbDatabase' };
    const topLevelName = path.split('/', 1)[0];
    const removalPath = topLevelName === DUCKDB_FOLDER ? path : topLevelName;
    return { id: `other:${removalPath}`, name: removalPath, removalPath, typeId: 'other' };
}

async function collectOpfsFiles(directory: FileSystemDirectoryHandle, parentPath: string): Promise<OpfsFileSummary[]> {
    const files: OpfsFileSummary[] = [];
    for await (const handle of directory.values()) {
        const path = parentPath === '' ? handle.name : `${parentPath}/${handle.name}`;
        if (handle.kind === 'directory') {
            files.push(...(await collectOpfsFiles(handle, path)));
            continue;
        }

        try {
            const file = await handle.getFile();
            files.push({ lastModified: file.lastModified, path, size: file.size });
        } catch {
            files.push({ lastModified: undefined, path, size: undefined });
        }
    }
    return files;
}

async function clearOpfs(): Promise<void> {
    const storageManager = findStorageManager();
    if (typeof storageManager?.getDirectory !== 'function') return;

    const root = await storageManager.getDirectory();
    // The names are collected before any is removed, because removing entries while iterating could skip some.
    const names: string[] = [];
    // eslint-disable-next-line unicorn/prefer-array-from-async -- 'Array.fromAsync' is not in the ES2023 library the app builds with.
    for await (const name of root.keys()) names.push(name);
    for (const name of names) await root.removeEntry(name, { recursive: true });
}
