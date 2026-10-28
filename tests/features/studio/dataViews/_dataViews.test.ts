// ── External Dependencies & Registrations
import { VueQueryPlugin } from '@tanstack/vue-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { queryClient } from '@/services/queryClient';
import { sessionIsAuthenticated } from '@/state/session';
import { settle } from '~/tests/support/settle';
import {
    abortDataViewContentAudit,
    auditDataViewContent,
    cancelDataViewRetrieval,
    NEW_DATA_VIEW_ID,
    resolveDataViewIdParameter,
    useCreateDataView,
    useDataView,
    useDataViews,
    useDeleteDataView,
    useUpdateDataView
} from '@/features/studio/dataViews/_dataViews';
import { configStatus, findConnectionLocalisedConfig } from '@/state/configs';
import {
    constructMetaStoreListKey,
    constructMetaStoreRecordKey,
    getMetaStoreRecord,
    removeMetaStoreRecord,
    retrieveMetaStoreRecords,
    upsertMetaStoreRecord
} from '@/services/metaStore';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// The meta store goes through the engine worker, which jsdom cannot run. Its query keys stay real, so the cache entries
// asserted on are the ones the app uses.
vi.mock('@/services/metaStore', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/services/metaStore')>()),
    getMetaStoreRecord: vi.fn(),
    removeMetaStoreRecord: vi.fn(() => Promise.resolve(GUEST_META_STORE_ID)),
    retrieveMetaStoreRecords: vi.fn(),
    upsertMetaStoreRecord: vi.fn(() => Promise.resolve(GUEST_META_STORE_ID))
}));

// The audit goes through the engine worker too. The connection is looked up by id, so only that lookup is replaced.
vi.mock('@/services/engine', () => ({ establishEngineWorker: vi.fn() }));
vi.mock('@/state/configs', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/state/configs')>()),
    findConnectionLocalisedConfig: vi.fn()
}));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const GUEST_META_STORE_ID = 'dpuMetaStore'; // The store in use while signed out, which every test is.
const LIST_KEY = constructMetaStoreListKey('dataViews');
const PREVIOUS_META_STORE_ID = 'dpuMetaStore-previous'; // Stands for the store of a user who signed out while a change was under way.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = []; // Unmounted after each test, so no query from one test keeps filling the cache.

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildDataView(id: string, label: string): DataViewConfig {
    return { id, label: { en: label }, icon: null, iconDark: null, typeId: 'dataView' } as DataViewConfig;
}

function renderNothing(): ReturnType<typeof h> {
    return h('div');
}

function cachedList(): DataViewConfig[] | undefined {
    return queryClient.getQueryData<DataViewConfig[]>(LIST_KEY);
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

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('data views', () => {
    beforeEach(() => {
        configStatus.value = { typeId: 'ready' };
        sessionIsAuthenticated.value = false;
        vi.mocked(retrieveMetaStoreRecords).mockResolvedValue([buildDataView('a', 'Sales'), buildDataView('b', 'Stock')]);
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        queryClient.clear();
        sessionIsAuthenticated.value = undefined;
        vi.clearAllMocks();
    });

    describe('useDataViews', () => {
        it('reads the list once the configuration is ready, adding the icon to each', async () => {
            const { data } = await runInComponent(() => useDataViews());

            expect(data.value?.map((config) => config.id)).toStrictEqual(['a', 'b']);
            expect(data.value?.every((config) => config.icon != null)).toBe(true);
        });

        it('waits rather than fails while the configuration is pending', async () => {
            configStatus.value = { typeId: 'pending' };
            const { data } = await runInComponent(() => useDataViews());

            expect(data.value).toBeUndefined();
            expect(retrieveMetaStoreRecords).not.toHaveBeenCalled();
        });

        it('names the failure in the user’s terms when the store cannot be read', async () => {
            vi.mocked(retrieveMetaStoreRecords).mockRejectedValueOnce(new Error('Worker gone.'));
            const { error } = await runInComponent(() => useDataViews());

            expect(error.value?.message).toBe('Failed to retrieve data views.');
        });

        it('aborts a read that is cancelled, leaving the list not loaded rather than failed', async () => {
            const signals: (AbortSignal | undefined)[] = [];
            // A stuck read, which settles only when aborted, as the meta store's does.
            vi.mocked(retrieveMetaStoreRecords).mockImplementationOnce(async (_nodeId, signal) => {
                signals.push(signal);
                return new Promise<never>((_resolve, reject) => {
                    signal?.addEventListener('abort', () => {
                        reject(signal.reason as Error);
                    });
                });
            });
            const { data, error } = await runInComponent(() => useDataViews());

            await cancelDataViewRetrieval();

            expect(signals[0]?.aborted).toBe(true);
            expect(data.value).toBeUndefined();
            expect(error.value).toBeNull();
        });
    });

    describe('useDataView', () => {
        it('starts from the list’s copy rather than reading the store again', async () => {
            await runInComponent(() => useDataViews());
            const { data } = await runInComponent(() => useDataView('b'));

            expect(data.value?.id).toBe('b');
            expect(getMetaStoreRecord).not.toHaveBeenCalled();
        });
    });

    describe('mutations', () => {
        it('saves a new data view with its connection and adds it to a loaded list', async () => {
            await runInComponent(() => useDataViews());
            const { mutateAsync } = await runInComponent(() => useCreateDataView());

            const created = await mutateAsync('connection-1');

            expect(upsertMetaStoreRecord).toHaveBeenCalledOnce();
            expect(created.connectionId).toBe('connection-1');
            expect(created.label).toStrictEqual({ en: 'Untitled Data View', es: 'Vista de datos sin título' });
            expect(cachedList()?.map((config) => config.id)).toStrictEqual(['a', 'b', created.id]);
        });

        it('stores the data view without its icon, which is added on reading', async () => {
            const { mutateAsync } = await runInComponent(() => useUpdateDataView());

            await mutateAsync({ ...buildDataView('a', 'Sales'), icon: '<svg />' });

            expect(vi.mocked(upsertMetaStoreRecord).mock.calls[0]?.[1]).toMatchObject({ icon: null, iconDark: null });
        });

        it('leaves a list that has not loaded alone, so loading it later picks the change up', async () => {
            const { mutateAsync } = await runInComponent(() => useCreateDataView());

            const created = await mutateAsync('connection-1');

            expect(cachedList()).toBeUndefined();
            expect(queryClient.getQueryData(constructMetaStoreRecordKey('dataViews', created.id))).toStrictEqual(created);
        });

        it('replaces an updated data view in place in the list', async () => {
            await runInComponent(() => useDataViews());
            const { mutateAsync } = await runInComponent(() => useUpdateDataView());

            await mutateAsync(buildDataView('a', 'Sales by region'));

            expect(cachedList()?.map((config) => config.label)).toStrictEqual([{ en: 'Sales by region' }, { en: 'Stock' }]);
        });

        it('removes a deleted data view from the list and drops its own entry', async () => {
            await runInComponent(() => useDataViews());
            await runInComponent(() => useDataView('a'));
            const { mutateAsync } = await runInComponent(() => useDeleteDataView());

            await mutateAsync('a');

            expect(removeMetaStoreRecord).toHaveBeenCalledWith('dataViews', 'a');
            expect(cachedList()?.map((config) => config.id)).toStrictEqual(['b']);
            expect(queryClient.getQueryData(constructMetaStoreRecordKey('dataViews', 'a'))).toBeUndefined();
        });

        it('keeps a save that finishes after signing in or out out of the next user’s list', async () => {
            await runInComponent(() => useDataViews());
            const { mutateAsync } = await runInComponent(() => useUpdateDataView());
            vi.mocked(upsertMetaStoreRecord).mockResolvedValueOnce(PREVIOUS_META_STORE_ID);

            await mutateAsync(buildDataView('a', 'Sales by region'));

            expect(cachedList()?.map((config) => config.label)).toStrictEqual([{ en: 'Sales' }, { en: 'Stock' }]);
        });

        it('keeps a delete that finishes after signing in or out out of the next user’s list', async () => {
            await runInComponent(() => useDataViews());
            const { mutateAsync } = await runInComponent(() => useDeleteDataView());
            vi.mocked(removeMetaStoreRecord).mockResolvedValueOnce(PREVIOUS_META_STORE_ID);

            await mutateAsync('a');

            expect(cachedList()?.map((config) => config.id)).toStrictEqual(['a', 'b']);
        });
    });

    describe('auditDataViewContent', () => {
        it('audits the item the way its saved preview read it, passing on progress', async () => {
            const connectionConfig = { id: 'connection-a' };
            const contentAuditConfig = { recordCount: 2 };
            const processRequest = vi.fn((_id: string, _config: unknown, _options: unknown, callback: (callbackData: unknown) => void) => {
                callback({ typeId: 'progress', properties: { recordCount: 2 } });
                return Promise.resolve({ contentAuditConfig });
            });
            vi.mocked(findConnectionLocalisedConfig).mockReturnValue(connectionConfig as never);
            vi.mocked(establishEngineWorker).mockResolvedValue({ processRequest } as never);
            const dataViewConfig = {
                ...buildDataView('a', 'Sales'),
                connectionId: 'connection-a',
                connectionNodeConfig: { extension: 'csv', folderPath: '/reports', name: 'sales' },
                previewConfig: { dataFormatId: 'dtv', encodingId: 'utf-8', hasHeaders: true, parserId: 'dpuse-tool-adaltas-csv-parser', valueDelimiterId: ';' }
            } as DataViewConfig;
            const onProgress = vi.fn();

            expect(await auditDataViewContent(dataViewConfig, onProgress)).toBe(contentAuditConfig);
            expect(processRequest).toHaveBeenCalledWith(
                'auditObjectContent',
                connectionConfig,
                {
                    chunkSize: undefined,
                    dataFormatId: 'dtv',
                    encodingId: 'utf-8',
                    hasHeaders: true,
                    parserId: 'dpuse-tool-adaltas-csv-parser',
                    path: '/reports/sales.csv',
                    valueDelimiterId: ';'
                },
                expect.any(Function)
            );
            expect(onProgress).toHaveBeenCalledWith(2);
        });
    });

    describe('abortDataViewContentAudit', () => {
        it('asks the engine to stop the connection’s operation', async () => {
            const connectionConfig = { id: 'connection-a' };
            const processRequest = vi.fn(() => Promise.resolve());
            vi.mocked(findConnectionLocalisedConfig).mockReturnValue(connectionConfig as never);
            vi.mocked(establishEngineWorker).mockResolvedValue({ processRequest } as never);

            await abortDataViewContentAudit('connection-a');

            expect(processRequest).toHaveBeenCalledWith('abort', connectionConfig, {});
        });

        it('does nothing for a connection that no longer exists', async () => {
            vi.mocked(findConnectionLocalisedConfig).mockReturnValue(undefined);

            await abortDataViewContentAudit('connection-gone');

            expect(establishEngineWorker).not.toHaveBeenCalled();
        });
    });

    describe('resolveDataViewIdParameter', () => {
        it('reads a data view id from the URL', () => {
            expect(resolveDataViewIdParameter('a')).toBe('a');
        });

        it('has no id for a data view being added, or for a missing parameter', () => {
            expect(resolveDataViewIdParameter(NEW_DATA_VIEW_ID)).toBeUndefined();
            expect(resolveDataViewIdParameter(undefined)).toBeUndefined();
        });
    });
});
