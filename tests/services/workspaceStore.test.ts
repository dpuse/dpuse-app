// ── External Dependencies & Registrations
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';

// ── Local Framework
import type * as SessionModule from '@/state/session';
import type * as WorkspaceStoreModule from '@/services/workspaceStore';
import { constructWorkspaceStoreListKey, constructWorkspaceStoreRecordKey } from '@/services/workspaceStore';

// The session is replaced by its two refs, so a test can sign in and out without Hanko. Each fresh import of the app
// gets its own pair.
vi.mock('@/state/session', () => ({ accountId: ref<string | undefined>(), sessionIsAuthenticated: ref<boolean | undefined>() }));

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface App {
    session: typeof SessionModule;
    workspaceStore: typeof WorkspaceStoreModule;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A fresh copy of the app's modules, as a reload or another tab has. IndexedDB is shared between copies, as it is
// between tabs.
async function importApp(): Promise<App> {
    vi.resetModules();
    return { session: await import('@/state/session'), workspaceStore: await import('@/services/workspaceStore') };
}

async function signIn({ session }: App, accountId: string | undefined): Promise<void> {
    session.accountId.value = accountId;
    session.sessionIsAuthenticated.value = accountId != null;
    await nextTick();
}

async function listIds({ workspaceStore }: App): Promise<string[]> {
    const records = await workspaceStore.retrieveWorkspaceStoreRecords<{ id: string }>('dataViews');
    return records.map((record) => record.id).toSorted((leftId, rightId) => leftId.localeCompare(rightId));
}

// A meta store database as the Dexie connector left it: a 'dataViews' table keyed by id, at a Dexie version number.
async function seedMetaStore(metaStoreId: string, records: { id: string }[]): Promise<void> {
    const request = indexedDB.open(metaStoreId, 10);
    request.addEventListener('upgradeneeded', () => {
        request.result.createObjectStore('dataViews', { keyPath: 'id' });
    });
    const database = await new Promise<IDBDatabase>((resolve) => {
        request.addEventListener('success', () => {
            resolve(request.result);
        });
    });
    const transaction = database.transaction('dataViews', 'readwrite');
    for (const record of records) transaction.objectStore('dataViews').put(record);
    await new Promise((resolve) => {
        transaction.addEventListener('complete', resolve);
    });
    database.close();
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// A list and its records sit on separate branches under one table, so refreshing a list leaves open records alone, and
// everything shares the 'workspaceStore' root, so signing in or out can drop it all at once.
describe('workspace store query keys', () => {
    it('puts a list and its records on separate branches of the same table', () => {
        expect(constructWorkspaceStoreListKey('dataViews')).toStrictEqual(['workspaceStore', 'dataViews', 'list']);
        expect(constructWorkspaceStoreRecordKey('dataViews', 'a')).toStrictEqual(['workspaceStore', 'dataViews', 'record', 'a']);
    });
});

describe('workspace store', () => {
    beforeEach(() => {
        vi.stubGlobal('indexedDB', new IDBFactory()); // Every test starts with a browser that has no databases.
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('saves, lists, opens and removes a config, keeping the whole object in one cell', async () => {
        const app = await importApp();
        await signIn(app, undefined);
        const config = { id: 'a', label: { en: 'Sales' }, previewConfig: { hasHeaders: true } };

        expect(await app.workspaceStore.upsertWorkspaceStoreRecord('dataViews', config)).toBe('dpuseWorkspaceStore');
        expect(await app.workspaceStore.getWorkspaceStoreRecord('dataViews', 'a')).toStrictEqual(config);
        expect(await listIds(app)).toStrictEqual(['a']);

        await app.workspaceStore.removeWorkspaceStoreRecord('dataViews', 'a');

        expect(await listIds(app)).toStrictEqual([]);
        await expect(app.workspaceStore.getWorkspaceStoreRecord('dataViews', 'a')).rejects.toThrow("No record 'a' in 'dataViews'.");
    });

    it('waits for the session check before choosing a store', async () => {
        const app = await importApp();
        const saving = app.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id: 'a' });

        await signIn(app, 'account-1');

        expect(await saving).toBe('dpuseWorkspaceStore-account-1');
    });

    it('keeps guest work and each account’s work apart', async () => {
        const app = await importApp();
        await signIn(app, undefined);
        await app.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id: 'guest' });
        await signIn(app, 'account-1');
        await app.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id: 'account-1' });

        expect(await listIds(app)).toStrictEqual(['account-1']);

        await signIn(app, 'account-2');

        expect(await listIds(app)).toStrictEqual([]);

        await signIn(app, undefined);

        expect(await listIds(app)).toStrictEqual(['guest']);
    });

    it('reads work another tab has saved before making a change, rather than overwriting it', async () => {
        const firstTab = await importApp();
        await signIn(firstTab, undefined);
        await firstTab.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id: 'a' });
        const secondTab = await importApp();
        await signIn(secondTab, undefined);
        await secondTab.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id: 'b' });

        await firstTab.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id: 'c' });

        expect(await listIds(secondTab)).toStrictEqual(['a', 'b', 'c']);
    });

    it('keeps every change when several are made at once', async () => {
        const app = await importApp();
        await signIn(app, undefined);

        await Promise.all(['a', 'b', 'c'].map(async (id) => app.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id })));

        const reloadedApp = await importApp();
        await signIn(reloadedApp, undefined);

        expect(await listIds(reloadedApp)).toStrictEqual(['a', 'b', 'c']);
    });

    it('stops waiting for a list when the read is aborted', async () => {
        const app = await importApp();
        await signIn(app, undefined);
        const controller = new AbortController();
        const reading = app.workspaceStore.retrieveWorkspaceStoreRecords('dataViews', controller.signal);

        controller.abort(new Error('Cancelled.'));

        await expect(reading).rejects.toThrow('Cancelled.');
    });

    describe('meta store move', () => {
        it('copies each store’s meta store work across once, leaving the meta store in place', async () => {
            await seedMetaStore('dpuMetaStore', [{ id: 'guest' }]);
            await seedMetaStore('dpuMetaStore-account-1', [{ id: 'a' }, { id: 'b' }]);
            const app = await importApp();
            await signIn(app, undefined);

            expect(await listIds(app)).toStrictEqual(['guest']);

            await signIn(app, 'account-1');

            expect(await listIds(app)).toStrictEqual(['a', 'b']);
            const databaseInfos = await indexedDB.databases();
            expect(databaseInfos.map((databaseInfo) => databaseInfo.name)).toContain('dpuMetaStore-account-1');
        });

        it('does not bring back meta store work that was removed after the move', async () => {
            await seedMetaStore('dpuMetaStore', [{ id: 'a' }]);
            const app = await importApp();
            await signIn(app, undefined);
            await app.workspaceStore.removeWorkspaceStoreRecord('dataViews', 'a');

            const reloadedApp = await importApp();
            await signIn(reloadedApp, undefined);

            expect(await listIds(reloadedApp)).toStrictEqual([]);
        });

        it('opens a store with no meta store and creates no meta store database', async () => {
            const app = await importApp();
            await signIn(app, undefined);

            expect(await listIds(app)).toStrictEqual([]);
            const databaseInfos = await indexedDB.databases();
            expect(databaseInfos.map((databaseInfo) => databaseInfo.name)).not.toContain('dpuMetaStore');
        });
    });

    describe('guest and account work', () => {
        it('counts guest work and moves it into the account, out of the guest store', async () => {
            const app = await importApp();
            await signIn(app, undefined);
            await app.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id: 'a' });
            await signIn(app, 'account-1');

            expect(await app.workspaceStore.countGuestWorkspaceStoreRecords()).toBe(1);

            await app.workspaceStore.moveGuestWorkspaceStoreRecords();

            expect(await app.workspaceStore.countGuestWorkspaceStoreRecords()).toBe(0);
            expect(await listIds(app)).toStrictEqual(['a']);
        });

        it('removes the account’s work and leaves guest work alone', async () => {
            const app = await importApp();
            await signIn(app, undefined);
            await app.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id: 'guest' });
            await signIn(app, 'account-1');
            await app.workspaceStore.upsertWorkspaceStoreRecord('dataViews', { id: 'a' });

            await app.workspaceStore.removeAccountWorkspaceStoreRecords();

            expect(await listIds(app)).toStrictEqual([]);
            expect(await app.workspaceStore.countGuestWorkspaceStoreRecords()).toBe(1);
        });
    });
});
