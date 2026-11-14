// ── External Dependencies & Registrations
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { clearBrowserStorage, clearLocalStorage, removeIndexedDatabase } from '@/features/session/dataPanel/_browserStorage';
import { type OpfsItemSummary, removeLocalStorageItem } from '@/features/session/dataPanel/_browserStorage';
import { removeOpfsItem, retrieveBrowserStorageSnapshot } from '@/features/session/dataPanel/_browserStorage';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Just enough of an OPFS directory for the module: jsdom has no OPFS.
interface FakeDirectory {
    getDirectoryHandle: (name: string) => Promise<FakeDirectory>;
    keys: () => AsyncGenerator<string>;
    kind: 'directory';
    listNames: () => string[]; // For the tests to check what is left, without iterating.
    name: string;
    removeEntry: (name: string, options?: { recursive?: boolean }) => Promise<void>;
    values: () => AsyncGenerator<FakeDirectory | FakeFile>;
}

interface FakeFile {
    getFile: () => Promise<{ lastModified: number; size: number }>;
    kind: 'file';
    name: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATABASE_NAME = 'dpuse-store';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('browser storage', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        vi.stubGlobal('indexedDB', new IDBFactory()); // Every test starts with a browser that has no databases.
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe('snapshot', () => {
        it('lists local storage items by key, sized at two bytes a character', async () => {
            localStorage.setItem('dpuse-b', 'xyz');
            localStorage.setItem('dpuse-a', '1');

            const { localStorageItems } = await retrieveBrowserStorageSnapshot();

            expect(localStorageItems).toStrictEqual([
                { key: 'dpuse-a', size: 16, value: '1' },
                { key: 'dpuse-b', size: 20, value: 'xyz' }
            ]);
        });

        it('lists IndexedDB databases by name, with their versions', async () => {
            const database = await createDatabase({ people: 2 });
            database.close();

            const { indexedDatabases } = await retrieveBrowserStorageSnapshot();

            expect(indexedDatabases).toStrictEqual([{ name: DATABASE_NAME, version: 1 }]);
        });

        it('has no estimate or OPFS where the browser has no storage manager', async () => {
            vi.stubGlobal('navigator', {});

            const { estimate, opfsItems } = await retrieveBrowserStorageSnapshot();

            expect(estimate).toBeUndefined();
            expect(opfsItems).toBeUndefined();
        });

        it('reports the estimate, including Chromium usage by kind of storage', async () => {
            stubStorageManager(buildDirectory('', []), { quota: 1000, usage: 300, usageDetails: { fileSystem: 50, indexedDB: 200 } });

            const { estimate } = await retrieveBrowserStorageSnapshot();

            expect(estimate).toStrictEqual({ fileSystemUsage: 50, indexedDatabaseUsage: 200, quota: 1000, usage: 300 });
        });

        it('groups OPFS files into the SQLite pool, each DuckDB database, DuckDB temporary files and other entries', async () => {
            stubStorageManager(buildOpfsRoot());

            const { opfsItems } = await retrieveBrowserStorageSnapshot();

            expect(opfsItems).toStrictEqual([
                { id: 'sqlitePool', lastModified: 2, name: '.dpuse-connector-sqlite-wasm', removalPaths: ['.dpuse-connector-sqlite-wasm'], size: 300, typeId: 'sqlitePool' },
                {
                    id: 'duckdbDatabase:default',
                    lastModified: 4,
                    name: 'default',
                    removalPaths: ['duckdb/fs/default.duckdb', 'duckdb/fs/default.duckdb.wal'],
                    size: 60,
                    typeId: 'duckdbDatabase'
                },
                { id: 'duckdbDatabase:sales', lastModified: 5, name: 'sales', removalPaths: ['duckdb/fs/sales.duckdb'], size: 70, typeId: 'duckdbDatabase' },
                { id: 'duckdbTemporaryFiles', lastModified: undefined, name: 'duckdb/scratch', removalPaths: ['duckdb/scratch'], size: undefined, typeId: 'duckdbTemporaryFiles' },
                { id: 'other:duckdb/fs/notes.txt', lastModified: 6, name: 'duckdb/fs/notes.txt', removalPaths: ['duckdb/fs/notes.txt'], size: 8, typeId: 'other' },
                { id: 'other:exports', lastModified: 7, name: 'exports', removalPaths: ['exports'], size: 9, typeId: 'other' }
            ]);
        });
    });

    describe('removal', () => {
        it('removes one local storage item, or all of them', () => {
            localStorage.setItem('dpuse-a', '1');
            localStorage.setItem('dpuse-b', '2');

            removeLocalStorageItem('dpuse-a');
            expect(Object.keys(localStorage)).toStrictEqual(['dpuse-b']);

            clearLocalStorage();
            expect(localStorage).toHaveLength(0);
        });

        it('removes an IndexedDB database', async () => {
            const database = await createDatabase({ people: 1 });
            database.close();

            await removeIndexedDatabase(DATABASE_NAME);

            expect(await indexedDB.databases()).toStrictEqual([]);
        });

        it('fails with a clear message while another connection blocks the delete', async () => {
            const database = await createDatabase({ people: 1 }); // Stays open, because it does not close on 'versionchange' as Dexie and TinyBase do.

            await expect(removeIndexedDatabase(DATABASE_NAME)).rejects.toThrow("IndexedDB database 'dpuse-store' is in use. Reload the app and try again.");
            database.close();
        });

        it('removes an OPFS item with every file and folder it groups', async () => {
            const root = buildOpfsRoot();
            stubStorageManager(root);
            const { opfsItems = [] } = await retrieveBrowserStorageSnapshot();

            await removeOpfsItem(findOpfsItem(opfsItems, 'duckdbDatabase:default'));
            await removeOpfsItem(findOpfsItem(opfsItems, 'sqlitePool'));

            const { opfsItems: remainingOpfsItems = [] } = await retrieveBrowserStorageSnapshot();
            expect(remainingOpfsItems.map((opfsItem) => opfsItem.id)).toStrictEqual([
                'duckdbDatabase:sales',
                'duckdbTemporaryFiles',
                'other:duckdb/fs/notes.txt',
                'other:exports'
            ]);
            expect(root.listNames()).toStrictEqual(['duckdb', 'exports']);
        });

        it('clears local storage, session storage, every database and every OPFS entry', async () => {
            const root = buildDirectory('', [buildFile('b.duckdb', 10, 5), buildDirectory('folder', [])]);
            stubStorageManager(root);
            localStorage.setItem('dpuse-a', '1');
            sessionStorage.setItem('dpuse-b', '2');
            const database = await createDatabase({ people: 1 });
            database.close();

            await clearBrowserStorage();

            expect(localStorage).toHaveLength(0);
            expect(sessionStorage).toHaveLength(0);
            expect(await indexedDB.databases()).toStrictEqual([]);
            expect(root.listNames()).toStrictEqual([]);
        });

        it('removes everything it can before failing with every failure', async () => {
            const root = buildDirectory('', [buildFile('b.duckdb', 10, 5)]);
            root.removeEntry = (): Promise<void> => Promise.reject(new Error('Locked.'));
            stubStorageManager(root);
            const database = await createDatabase({ people: 1 });
            database.close();

            await expect(clearBrowserStorage()).rejects.toThrow(AggregateError);
            expect(await indexedDB.databases()).toStrictEqual([]);
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Creates the database at version 1 with a table for each name, holding the given number of records.
function createDatabase(recordCountsByTableName: Record<string, number>): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DATABASE_NAME, 1);
        request.addEventListener('upgradeneeded', () => {
            for (const [tableName, recordCount] of Object.entries(recordCountsByTableName)) {
                const table = request.result.createObjectStore(tableName, { autoIncrement: true });
                for (let index = 0; index < recordCount; index++) table.add({ index });
            }
        });
        request.addEventListener('success', () => {
            resolve(request.result);
        });
        request.addEventListener('error', () => {
            reject(request.error ?? new Error('Failed to create the database.'));
        });
    });
}

// The folders the SQLite and DuckDB connectors write, with a file the app does not recognise in each kind of place. The
// DuckDB scratch file is held open, so it cannot be read.
function buildOpfsRoot(): FakeDirectory {
    const lockedFile: FakeFile = { getFile: () => Promise.reject(new Error('Locked.')), kind: 'file', name: 'temp-1' };
    const duckdbFiles = [buildFile('default.duckdb', 50, 3), buildFile('default.duckdb.wal', 10, 4), buildFile('sales.duckdb', 70, 5), buildFile('notes.txt', 8, 6)];
    const duckdbFolder = buildDirectory('duckdb', [buildDirectory('fs', duckdbFiles), buildDirectory('scratch', [lockedFile])]);
    const sqlitePoolFolder = buildDirectory('.dpuse-connector-sqlite-wasm', [buildFile('a1b2', 100, 1), buildFile('c3d4', 200, 2)]);
    return buildDirectory('', [sqlitePoolFolder, duckdbFolder, buildDirectory('exports', [buildFile('data.csv', 9, 7)])]);
}

function findOpfsItem(opfsItems: OpfsItemSummary[], id: string): OpfsItemSummary {
    const opfsItem = opfsItems.find((candidate) => candidate.id === id);
    if (!opfsItem) throw new Error(`No OPFS item '${id}'.`);
    return opfsItem;
}

function buildFile(name: string, size: number, lastModified: number): FakeFile {
    return { getFile: () => Promise.resolve({ lastModified, size }), kind: 'file', name };
}

function buildDirectory(name: string, children: (FakeDirectory | FakeFile)[]): FakeDirectory {
    const entries = new Map(children.map((child) => [child.name, child]));
    return {
        getDirectoryHandle: (childName): Promise<FakeDirectory> => {
            const child = entries.get(childName);
            return child?.kind === 'directory' ? Promise.resolve(child) : Promise.reject(new Error(`No folder '${childName}'.`));
        },
        async *keys(): AsyncGenerator<string> {
            await Promise.resolve();
            yield* entries.keys();
        },
        kind: 'directory',
        listNames: (): string[] => Array.from(entries, ([childName]) => childName),
        name,
        removeEntry: (childName): Promise<void> => {
            entries.delete(childName);
            return Promise.resolve();
        },
        async *values(): AsyncGenerator<FakeDirectory | FakeFile> {
            await Promise.resolve();
            yield* entries.values();
        }
    };
}

function stubStorageManager(root: FakeDirectory, estimate: Record<string, unknown> = {}): void {
    vi.stubGlobal('navigator', { storage: { estimate: () => Promise.resolve(estimate), getDirectory: () => Promise.resolve(root) } });
}
