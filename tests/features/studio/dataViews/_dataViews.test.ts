// ── External Dependencies & Registrations
import { VueQueryPlugin } from '@tanstack/vue-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { queryClient } from '@/services/queryClient';
import { sessionIsAuthenticated } from '@/state/session';
import { settle } from '~/tests/support/settle';
import {
    abortDataViewContentAudit,
    auditDataViewContent,
    cancelDataViewRetrieval,
    constructNewDataViewConfig,
    NEW_DATA_VIEW_ID,
    resolveDataViewIdParameter,
    useCurrentDataView,
    useDataView,
    useDataViews,
    useDeleteDataView,
    useUpdateDataView
} from '@/features/studio/dataViews/_dataViews';
import { changeDataView, draftDataViewConfig } from '@/features/studio/dataViews/_dataViewDraft';
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

// The audit goes through the engine worker too. The connection is looked up by id, so only that lookup is replaced.
vi.mock('@/services/engine', () => ({ establishEngineWorker: vi.fn() }));
vi.mock('@/state/configs', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/state/configs')>()),
    findConnectionLocalisedConfig: vi.fn()
}));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const GUEST_WORKSPACE_STORE_ID = 'dpuseWorkspaceStore'; // The store in use while signed out, which every test is.
const LIST_KEY = constructWorkspaceStoreListKey('dataViews');
const PREVIOUS_WORKSPACE_STORE_ID = 'dpuseWorkspaceStore-previous'; // Stands for the store of a user who signed out while a change was under way.

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
        sessionIsAuthenticated.value = false;
        vi.mocked(retrieveWorkspaceStoreRecords).mockResolvedValue([buildDataView('a', 'Sales'), buildDataView('b', 'Stock')]);
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        queryClient.clear();
        sessionIsAuthenticated.value = undefined;
        vi.clearAllMocks();
    });

    describe('useDataViews', () => {
        it('reads the list, adding the icon to each', async () => {
            const { data } = await runInComponent(() => useDataViews());

            expect(data.value?.map((config) => config.id)).toStrictEqual(['a', 'b']);
            expect(data.value?.every((config) => config.icon != null)).toBe(true);
        });

        it('moves a record from an older build to one column set, taken from its audit', async () => {
            const auditColumn = { label: { en: 'Audited' } };
            const olderDataView = {
                ...buildDataView('a', 'Sales'),
                contentAuditConfig: { asAt: 7, columns: [auditColumn], recordCount: 2 },
                previewConfig: {
                    asAt: 3,
                    columnConfigs: [{ label: { en: 'Previewed' } }],
                    dataFormatId: 'dtv',
                    duration: 1,
                    hasHeaders: true,
                    parsedRecords: [],
                    size: 10,
                    text: undefined
                }
            };
            vi.mocked(retrieveWorkspaceStoreRecords).mockResolvedValueOnce([olderDataView]);
            const { data } = await runInComponent(() => useDataViews());

            const dataView = data.value?.[0];
            expect(dataView?.columnSetConfig).toMatchObject({ asAt: 7, columnConfigs: [auditColumn] });
            expect(dataView?.contentAuditConfig).toStrictEqual({ asAt: 7, byteCount: 0, isComplete: true, recordCount: 2 });
            expect(dataView?.previewConfig).toStrictEqual({ parsedRecords: [], size: 10, text: undefined });
            expect(dataView?.readConfig).toStrictEqual({ dataFormatId: 'dtv', hasHeaders: true });
            expect(dataView).not.toHaveProperty('auditSummaryConfig');
        });

        it('takes an older record’s columns from its preview when its audit has none', async () => {
            const previewColumn = { label: { en: 'Previewed' } };
            const olderDataView = {
                ...buildDataView('a', 'Sales'),
                contentAuditConfig: { asAt: 7, columns: [], recordCount: 2 },
                previewConfig: { asAt: 3, columnConfigs: [previewColumn], dataFormatId: 'dtv', duration: 1, parsedRecords: [], size: 10, text: undefined }
            };
            vi.mocked(retrieveWorkspaceStoreRecords).mockResolvedValueOnce([olderDataView]);
            const { data } = await runInComponent(() => useDataViews());

            expect(data.value?.[0]?.columnSetConfig).toStrictEqual({ asAt: 3, columnConfigs: [previewColumn] });
        });

        it('names the failure in the user’s terms when the store cannot be read', async () => {
            vi.mocked(retrieveWorkspaceStoreRecords).mockRejectedValueOnce(new Error('Worker gone.'));
            const { error } = await runInComponent(() => useDataViews());

            expect(error.value?.message).toBe('Failed to retrieve data views.');
        });

        it('aborts a read that is cancelled, leaving the list not loaded rather than failed', async () => {
            const signals: (AbortSignal | undefined)[] = [];
            // A read that settles only when aborted, standing for a slow store.
            vi.mocked(retrieveWorkspaceStoreRecords).mockImplementationOnce(async (_nodeId, signal) => {
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
            expect(getWorkspaceStoreRecord).not.toHaveBeenCalled();
        });
    });

    describe('mutations', () => {
        it('saves a new data view with its connection and adds it to a loaded list', async () => {
            await runInComponent(() => useDataViews());
            const { mutateAsync } = await runInComponent(() => useUpdateDataView());

            const created = await mutateAsync(constructNewDataViewConfig('connection-1'));

            expect(upsertWorkspaceStoreRecord).toHaveBeenCalledOnce();
            expect(created.connectionId).toBe('connection-1');
            expect(created.label).toStrictEqual({ en: 'Untitled Data View', es: 'Vista de datos sin título' });
            expect(cachedList()?.map((config) => config.id)).toStrictEqual(['a', 'b', created.id]);
        });

        it('stores the data view without its icon, which is added on reading', async () => {
            const { mutateAsync } = await runInComponent(() => useUpdateDataView());

            await mutateAsync({ ...buildDataView('a', 'Sales'), icon: '<svg />' });

            expect(vi.mocked(upsertWorkspaceStoreRecord).mock.calls[0]?.[1]).toMatchObject({ icon: null, iconDark: null });
        });

        it('leaves a list that has not loaded alone, so loading it later picks the change up', async () => {
            const { mutateAsync } = await runInComponent(() => useUpdateDataView());

            const created = await mutateAsync(constructNewDataViewConfig('connection-1'));

            expect(cachedList()).toBeUndefined();
            expect(queryClient.getQueryData(constructWorkspaceStoreRecordKey('dataViews', created.id))).toStrictEqual(created);
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

            expect(removeWorkspaceStoreRecord).toHaveBeenCalledWith('dataViews', 'a');
            expect(cachedList()?.map((config) => config.id)).toStrictEqual(['b']);
            expect(queryClient.getQueryData(constructWorkspaceStoreRecordKey('dataViews', 'a'))).toBeUndefined();
        });

        it('keeps a save that finishes after signing in or out out of the next user’s list', async () => {
            await runInComponent(() => useDataViews());
            const { mutateAsync } = await runInComponent(() => useUpdateDataView());
            vi.mocked(upsertWorkspaceStoreRecord).mockResolvedValueOnce(PREVIOUS_WORKSPACE_STORE_ID);

            await mutateAsync(buildDataView('a', 'Sales by region'));

            expect(cachedList()?.map((config) => config.label)).toStrictEqual([{ en: 'Sales' }, { en: 'Stock' }]);
        });

        it('keeps a delete that finishes after signing in or out out of the next user’s list', async () => {
            await runInComponent(() => useDataViews());
            const { mutateAsync } = await runInComponent(() => useDeleteDataView());
            vi.mocked(removeWorkspaceStoreRecord).mockResolvedValueOnce(PREVIOUS_WORKSPACE_STORE_ID);

            await mutateAsync('a');

            expect(cachedList()?.map((config) => config.id)).toStrictEqual(['a', 'b']);
        });
    });

    describe('useCurrentDataView', () => {
        afterEach(() => {
            draftDataViewConfig.value = undefined;
        });

        it('shows the saved data view while there is no draft', async () => {
            await runInComponent(() => useDataViews());
            const { data, draftIsCurrent } = await runInComponent(() => useCurrentDataView('a'));

            expect(data.value?.label).toStrictEqual({ en: 'Sales' });
            expect(draftIsCurrent.value).toBe(false);
        });

        it('shows the draft over the saved data view, and stores nothing', async () => {
            await runInComponent(() => useDataViews());
            const { data, draftIsCurrent, savedData } = await runInComponent(() => useCurrentDataView('a'));

            changeDataView({ ...buildDataView('a', 'Sales'), connectionId: 'two' });

            expect(data.value?.connectionId).toBe('two');
            expect(draftIsCurrent.value).toBe(true);
            expect(savedData.value?.connectionId).not.toBe('two');
            expect(upsertWorkspaceStoreRecord).not.toHaveBeenCalled();
        });

        it('leaves another data view alone', async () => {
            await runInComponent(() => useDataViews());
            const { data } = await runInComponent(() => useCurrentDataView('b'));

            changeDataView({ ...buildDataView('a', 'Sales'), connectionId: 'two' });

            expect(data.value?.id).toBe('b');
        });

        it('gives a data view being added its draft, and stores nothing', async () => {
            const { data } = await runInComponent(() => useCurrentDataView(NEW_DATA_VIEW_ID));
            const draft = constructNewDataViewConfig('connection-1');

            changeDataView(draft);

            expect(data.value).toBe(draft);
            expect(upsertWorkspaceStoreRecord).not.toHaveBeenCalled();
        });
    });

    describe('auditDataViewContent', () => {
        it('audits the item the way the data view reads it, passing on progress', async () => {
            const connectionConfig = { id: 'connection-a' };
            const contentAuditConfig = { recordCount: 2 };
            const processRequest = vi.fn((_id: string, _config: unknown, _options: unknown, callback: (callbackData: unknown) => void) => {
                callback({ typeId: 'progress', properties: { byteCount: 90, recordCount: 2 } });
                return Promise.resolve({ contentAuditConfig });
            });
            vi.mocked(findConnectionLocalisedConfig).mockReturnValue(connectionConfig as never);
            vi.mocked(establishEngineWorker).mockResolvedValue({ processRequest } as never);
            const dataViewConfig = {
                ...buildDataView('a', 'Sales'),
                connectionId: 'connection-a',
                connectionNodeConfig: { extension: 'csv', folderPath: '/reports', name: 'sales' },
                readConfig: { dataFormatId: 'dtv', encodingId: 'utf-8', hasHeaders: true, parserId: 'dpuse-tool-adaltas-csv-parser', valueDelimiterId: ';' }
            } as DataViewConfig;
            const onProgress = vi.fn();

            expect(await auditDataViewContent(dataViewConfig, 2048, onProgress)).toBe(contentAuditConfig);
            expect(processRequest).toHaveBeenCalledWith(
                'auditObjectContent',
                connectionConfig,
                {
                    byteLimit: 2048,
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
            expect(onProgress).toHaveBeenCalledWith(2, 90);
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
