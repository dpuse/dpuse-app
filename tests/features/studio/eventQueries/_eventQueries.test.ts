// ── External Dependencies & Registrations
import { VueQueryPlugin } from '@tanstack/vue-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ContextEventReference, EventQueryConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { queryClient } from '@/services/queryClient';
import { sessionIsAuthenticated } from '@/state/session';
import { settle } from '~/tests/support/settle';
import {
    cancelEventQueryRetrieval,
    constructNewEventQueryConfig,
    useDeleteEventQuery,
    useEventQueries,
    useEventQuery,
    useUpdateEventQuery
} from '@/features/studio/eventQueries/_eventQueries';
import {
    constructWorkspaceStoreListKey,
    constructWorkspaceStoreRecordKey,
    getWorkspaceStoreRecord,
    removeWorkspaceStoreRecord,
    retrieveWorkspaceStoreRecords,
    upsertWorkspaceStoreRecord
} from '@/services/workspaceStore';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// The workspace store has its own tests, so its reads and writes are replaced here. Its query keys stay real, so the
// cache entries asserted on are the ones the app uses.
vi.mock('@/services/workspaceStore', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/services/workspaceStore')>()),
    getWorkspaceStoreRecord: vi.fn(),
    removeWorkspaceStoreRecord: vi.fn(() => Promise.resolve(GUEST_WORKSPACE_STORE_ID)),
    retrieveWorkspaceStoreRecords: vi.fn(),
    upsertWorkspaceStoreRecord: vi.fn(() => Promise.resolve(GUEST_WORKSPACE_STORE_ID))
}));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_EVENT_REFERENCE: ContextEventReference = { areaId: 'fdn', modelId: 'party', entityId: 'person', eventId: 'activation' };
const GUEST_WORKSPACE_STORE_ID = 'dpuseWorkspaceStore'; // The store in use while signed out, which every test is.
const LIST_KEY = constructWorkspaceStoreListKey('eventQueries');
const PREVIOUS_WORKSPACE_STORE_ID = 'dpuseWorkspaceStore-previous'; // Stands for the store of a user who signed out while a change was under way.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = []; // Unmounted after each test, so no query from one test keeps filling the cache.

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('event queries', () => {
    beforeEach(() => {
        sessionIsAuthenticated.value = false;
        vi.mocked(retrieveWorkspaceStoreRecords).mockResolvedValue([buildEventQuery('a', 'Hires'), buildEventQuery('b', 'Sales')]);
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        queryClient.clear();
        sessionIsAuthenticated.value = undefined;
        vi.clearAllMocks();
    });

    describe('useEventQueries', () => {
        it('reads the list from its own table, adding the icon to each', async () => {
            const { data } = await runInComponent(() => useEventQueries());

            expect(vi.mocked(retrieveWorkspaceStoreRecords).mock.calls[0]?.[0]).toBe('eventQueries');
            expect(data.value?.map((config) => config.id)).toStrictEqual(['a', 'b']);
            expect(data.value?.every((config) => config.icon != null)).toBe(true);
        });

        it('names the failure in the user’s terms when the store cannot be read', async () => {
            vi.mocked(retrieveWorkspaceStoreRecords).mockRejectedValueOnce(new Error('Worker gone.'));
            const { error } = await runInComponent(() => useEventQueries());

            expect(error.value?.message).toBe('Failed to retrieve event queries.');
        });

        it('aborts a read that is cancelled, leaving the list not loaded rather than failed', async () => {
            const signals: (AbortSignal | undefined)[] = [];
            // A read that settles only when aborted, standing for a slow store.
            vi.mocked(retrieveWorkspaceStoreRecords).mockImplementationOnce(async (_tableId, signal) => {
                signals.push(signal);
                return new Promise<never>((_resolve, reject) => {
                    signal?.addEventListener('abort', () => {
                        reject(signal.reason as Error);
                    });
                });
            });
            const { data, error } = await runInComponent(() => useEventQueries());

            await cancelEventQueryRetrieval();

            expect(signals[0]?.aborted).toBe(true);
            expect(data.value).toBeUndefined();
            expect(error.value).toBeNull();
        });
    });

    describe('useEventQuery', () => {
        it('starts from the list’s copy rather than reading the store again', async () => {
            await runInComponent(() => useEventQueries());
            const { data } = await runInComponent(() => useEventQuery('b'));

            expect(data.value?.id).toBe('b');
            expect(getWorkspaceStoreRecord).not.toHaveBeenCalled();
        });

        it('names the failure in the user’s terms when the event query cannot be read', async () => {
            vi.mocked(getWorkspaceStoreRecord).mockRejectedValueOnce(new Error("No record 'c' in 'eventQueries'."));
            const { error } = await runInComponent(() => useEventQuery('c'));

            expect(error.value?.message).toBe('Failed to open this event query.');
        });
    });

    describe('constructNewEventQueryConfig', () => {
        it('keeps the event it is for, puts the name and description in the current language, and keeps the untitled name in the others', () => {
            const config = constructNewEventQueryConfig(CONTEXT_EVENT_REFERENCE, 'es', 'Contrataciones', 'Altas del año');

            expect(config.typeId).toBe('eventQuery');
            expect(config.contextEventReference).toStrictEqual(CONTEXT_EVENT_REFERENCE);
            expect(config.label).toStrictEqual({ en: 'Untitled Event Query', es: 'Contrataciones' });
            expect(config.description).toStrictEqual({ es: 'Altas del año' });
        });

        it('names an event query given no name as untitled in every language', () => {
            const config = constructNewEventQueryConfig(CONTEXT_EVENT_REFERENCE, 'en', '', '');

            expect(config.label).toStrictEqual({ en: 'Untitled Event Query', es: 'Consulta de eventos sin título' });
            expect(config.description).toStrictEqual({});
        });
    });

    describe('mutations', () => {
        it('saves a new event query and adds it to a loaded list', async () => {
            await runInComponent(() => useEventQueries());
            const { mutateAsync } = await runInComponent(() => useUpdateEventQuery());

            const created = await mutateAsync(constructNewEventQueryConfig(CONTEXT_EVENT_REFERENCE, 'en', 'Hires by month', ''));

            expect(vi.mocked(upsertWorkspaceStoreRecord).mock.calls[0]?.[0]).toBe('eventQueries');
            expect(cachedList()?.map((config) => config.id)).toStrictEqual(['a', 'b', created.id]);
        });

        it('stores the event query without its icon, which is added on reading', async () => {
            const { mutateAsync } = await runInComponent(() => useUpdateEventQuery());

            await mutateAsync({ ...buildEventQuery('a', 'Hires'), icon: '<svg />' });

            expect(vi.mocked(upsertWorkspaceStoreRecord).mock.calls[0]?.[1]).toMatchObject({ icon: null, iconDark: null });
        });

        it('leaves a list that has not loaded alone, so loading it later picks the change up', async () => {
            const { mutateAsync } = await runInComponent(() => useUpdateEventQuery());

            const created = await mutateAsync(constructNewEventQueryConfig(CONTEXT_EVENT_REFERENCE, 'en', 'Hires by month', ''));

            expect(cachedList()).toBeUndefined();
            expect(queryClient.getQueryData(constructWorkspaceStoreRecordKey('eventQueries', created.id))).toStrictEqual(created);
        });

        it('replaces an updated event query in place in the list', async () => {
            await runInComponent(() => useEventQueries());
            const { mutateAsync } = await runInComponent(() => useUpdateEventQuery());

            await mutateAsync(buildEventQuery('a', 'Hires by month'));

            expect(cachedList()?.map((config) => config.label)).toStrictEqual([{ en: 'Hires by month' }, { en: 'Sales' }]);
        });

        it('names the failure in the user’s terms when a save fails', async () => {
            vi.mocked(upsertWorkspaceStoreRecord).mockRejectedValueOnce(new Error('Quota exceeded.'));
            const { mutateAsync } = await runInComponent(() => useUpdateEventQuery());

            await expect(mutateAsync(buildEventQuery('a', 'Hires'))).rejects.toThrow('Failed to save event query.');
        });

        it('removes a deleted event query from the list and drops its own entry', async () => {
            await runInComponent(() => useEventQueries());
            await runInComponent(() => useEventQuery('a'));
            const { mutateAsync } = await runInComponent(() => useDeleteEventQuery());

            await mutateAsync('a');

            expect(removeWorkspaceStoreRecord).toHaveBeenCalledWith('eventQueries', 'a');
            expect(cachedList()?.map((config) => config.id)).toStrictEqual(['b']);
            expect(queryClient.getQueryData(constructWorkspaceStoreRecordKey('eventQueries', 'a'))).toBeUndefined();
        });

        it('names the failure in the user’s terms when a delete fails', async () => {
            vi.mocked(removeWorkspaceStoreRecord).mockRejectedValueOnce(new Error('Store unavailable.'));
            const { mutateAsync } = await runInComponent(() => useDeleteEventQuery());

            await expect(mutateAsync('a')).rejects.toThrow('Failed to remove event query.');
        });

        it('keeps a save that finishes after signing in or out out of the next user’s list', async () => {
            await runInComponent(() => useEventQueries());
            const { mutateAsync } = await runInComponent(() => useUpdateEventQuery());
            vi.mocked(upsertWorkspaceStoreRecord).mockResolvedValueOnce(PREVIOUS_WORKSPACE_STORE_ID);

            await mutateAsync(buildEventQuery('a', 'Hires by month'));

            expect(cachedList()?.map((config) => config.label)).toStrictEqual([{ en: 'Hires' }, { en: 'Sales' }]);
        });

        it('keeps a delete that finishes after signing in or out out of the next user’s list', async () => {
            await runInComponent(() => useEventQueries());
            const { mutateAsync } = await runInComponent(() => useDeleteEventQuery());
            vi.mocked(removeWorkspaceStoreRecord).mockResolvedValueOnce(PREVIOUS_WORKSPACE_STORE_ID);

            await mutateAsync('a');

            expect(cachedList()?.map((config) => config.id)).toStrictEqual(['a', 'b']);
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildEventQuery(id: string, label: string): EventQueryConfig {
    return { id, label: { en: label }, description: {}, icon: null, iconDark: null, typeId: 'eventQuery' } as EventQueryConfig;
}

function renderNothing(): ReturnType<typeof h> {
    return h('div');
}

function cachedList(): EventQueryConfig[] | undefined {
    return queryClient.getQueryData<EventQueryConfig[]>(LIST_KEY);
}

// The hooks need a component to live in, with the app's query client installed as 'main.ts' installs it.
async function runInComponent<T>(useHooks: () => T): Promise<T> {
    let hooks: T | undefined;
    const wrapper = mount(
        defineComponent({
            setup() {
                hooks = useHooks();
                return renderNothing;
            }
        }),
        { global: { plugins: [[VueQueryPlugin, { queryClient }]] } }
    );
    wrappers.push(wrapper);
    await settle();
    return hooks as T;
}
