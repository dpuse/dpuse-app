// ── External Dependencies & Registrations
import { VueQueryPlugin } from '@tanstack/vue-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { configStatus } from '@/state/configs';
import { queryClient } from '@/services/queryClient';
import { settle } from '~/tests/support/settle';
import { constructMetaStoreListKey, constructMetaStoreRecordKey, getMetaStoreRecord, removeMetaStoreRecord, retrieveMetaStoreRecords, upsertMetaStoreRecord } from '@/services/metaStore';
import { useCreateDataView, useDataView, useDataViews, useDeleteDataView, useUpdateDataView } from '@/features/studio/dataViews/_dataViews';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// The meta store goes through the engine worker, which jsdom cannot run. Its query keys stay real, so the cache entries
// asserted on are the ones the app uses.
vi.mock('@/services/metaStore', async (importOriginal) => ({
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- Vitest's documented pattern for typing 'importOriginal'.
    ...(await importOriginal<typeof import('@/services/metaStore')>()),
    getMetaStoreRecord: vi.fn(),
    removeMetaStoreRecord: vi.fn(() => Promise.resolve()),
    retrieveMetaStoreRecords: vi.fn(),
    upsertMetaStoreRecord: vi.fn(() => Promise.resolve())
}));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const LIST_KEY = constructMetaStoreListKey('dataViews');

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
        vi.mocked(retrieveMetaStoreRecords).mockResolvedValue([buildDataView('a', 'Sales'), buildDataView('b', 'Stock')]);
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        queryClient.clear();
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
        it('saves a new data view at once and adds it to a loaded list', async () => {
            await runInComponent(() => useDataViews());
            const { mutateAsync } = await runInComponent(() => useCreateDataView());

            const created = await mutateAsync();

            expect(upsertMetaStoreRecord).toHaveBeenCalledOnce();
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

            const created = await mutateAsync();

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
    });
});
