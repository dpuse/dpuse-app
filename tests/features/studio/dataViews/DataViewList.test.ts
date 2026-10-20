// ── External Dependencies & Registrations
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { h, type PropType, type SetupContext } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT as CONFIRM_DIALOG_TEXT } from '@/components/ui/dialog/ConfirmDialog_.json';
import { TEXT as DATA_VIEW_LIST_TEXT } from '@/features/studio/dataViews/DataViewList_.json';
import { raiseAppFailure } from '@/state/errors';
import { settle } from '~/tests/support/settle';
import { t } from '@/state/locale';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

vi.mock('@/state/errors', async (importOriginal) => ({ ...(await importOriginal<object>()), raiseAppFailure: vi.fn() }));

// The list reads its data views and deletes them through these hooks, so the spec drives them directly: the refs below
// are the query and the mutation, and each test moves them the way a real delete would.
vi.mock('@/features/studio/dataViews/_dataViews', async () => {
    const { ref } = await import('vue');
    const state = {
        dataViewConfigs: ref<DataViewConfig[]>([]),
        deleteIsPending: ref(false),
        deleteDataView: vi.fn<(id: string) => Promise<void>>()
    };
    return {
        NEW_DATA_VIEW_ID: 'new',
        cancelDataViewRetrieval: vi.fn(),
        useDataViews: (): object => ({
            data: state.dataViewConfigs,
            error: ref(null),
            isError: ref(false),
            isFetching: ref(false),
            isSuccess: ref(true),
            refetch: vi.fn()
        }),
        useDeleteDataView: (): object => ({ isPending: state.deleteIsPending, mutateAsync: state.deleteDataView }),
        stateForTest: state
    };
});

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface StateForTest {
    dataViewConfigs: { value: DataViewConfig[] };
    deleteIsPending: { value: boolean };
    deleteDataView: ReturnType<typeof vi.fn<(id: string) => Promise<void>>>;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The grid needs a measured layout that jsdom cannot give, so this stand-in only shows the selected data view's detail.
const GridDetailPanelStub = {
    props: { selectedItem: { type: Object as PropType<LocalisedConfig<DataViewConfig>>, default: undefined } },
    setup(properties: { selectedItem?: LocalisedConfig<DataViewConfig> }, { slots }: SetupContext) {
        return (): ReturnType<typeof h> => h('div', properties.selectedItem ? slots.detail?.({ item: properties.selectedItem, close: vi.fn() }) : []);
    }
};

// The detail panel stands in as its Delete button, which is all the list reads from it.
const DataViewPanelStub = {
    props: { isDeleting: { type: Boolean, default: false } },
    emits: ['delete'],
    setup(properties: { isDeleting: boolean }, { emit }: SetupContext<['delete']>) {
        return (): ReturnType<typeof h> =>
            h(
                'button',
                {
                    'data-test': 'delete',
                    disabled: properties.isDeleting,
                    onClick: () => {
                        emit('delete');
                    }
                },
                'Delete Data View'
            );
    }
};

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildDataView(id: string, label: string): DataViewConfig {
    return { id, label: { en: label }, description: {}, icon: null, iconDark: null, typeId: 'dataView' } as DataViewConfig;
}

async function getState(): Promise<StateForTest> {
    const module_ = (await import('@/features/studio/dataViews/_dataViews')) as unknown as { stateForTest: StateForTest };
    return module_.stateForTest;
}

async function buildRouter(): Promise<Router> {
    const component = { render: (): null => null };
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { name: 'dataViews', path: '/dataViews/:dataViewId?', component },
            { name: 'connection', path: '/dataViews/:dataViewId/connections', component }
        ]
    });
    await router.push('/dataViews/a');
    await router.isReady();
    return router;
}

async function mountList(router: Router): Promise<VueWrapper> {
    const listModule = await import('@/features/studio/dataViews/DataViewList.vue');
    const wrapper = mount(listModule.default, {
        attachTo: document.body, // Focus only moves between elements in the document.
        global: { plugins: [router], stubs: { DataViewPanel: DataViewPanelStub, GridDetailPanel: GridDetailPanelStub } }
    });
    await settle();
    return wrapper;
}

function findDialogButton(label: string): HTMLButtonElement {
    const button = [...document.querySelectorAll<HTMLButtonElement>('[data-region="ConfirmDialog"] button')].find((candidate) => candidate.textContent.trim() === label);
    if (!button) throw new Error(`The confirm dialog has no '${label}' button.`);
    return button;
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('data view list deletion', () => {
    beforeEach(async () => {
        const state = await getState();
        state.dataViewConfigs.value = [buildDataView('a', 'Sales'), buildDataView('b', 'Stock')];
        state.deleteIsPending.value = false;
        state.deleteDataView.mockReset();
        vi.mocked(raiseAppFailure).mockClear();
        document.body.replaceChildren();
    });

    it('deletes nothing when the user cancels', async () => {
        const state = await getState();
        const router = await buildRouter();
        const wrapper = await mountList(router);

        await wrapper.get('[data-test="delete"]').trigger('click');
        await settle();
        findDialogButton(t(CONFIRM_DIALOG_TEXT, 'cancel.label')).click();
        await settle();

        expect(state.deleteDataView).not.toHaveBeenCalled();
        expect(router.currentRoute.value.params.dataViewId).toBe('a');
        wrapper.unmount();
    });

    it('deletes the selected data view, clears it from the URL and moves focus to the message', async () => {
        const state = await getState();
        // The list drops the data view as soon as the delete resolves, as the cache update does.
        state.deleteDataView.mockImplementation((id) => {
            state.dataViewConfigs.value = state.dataViewConfigs.value.filter((config) => config.id !== id);
            return Promise.resolve();
        });
        const router = await buildRouter();
        const wrapper = await mountList(router);

        await wrapper.get('[data-test="delete"]').trigger('click');
        await settle();
        findDialogButton(t(DATA_VIEW_LIST_TEXT, 'delete.confirm.label')).click();
        await settle();

        expect(state.deleteDataView).toHaveBeenCalledWith('a');
        expect(router.currentRoute.value.params.dataViewId).toBeUndefined();
        expect(document.activeElement?.textContent).toBe(t(DATA_VIEW_LIST_TEXT, 'delete.done.text', { name: 'Sales' }));
        wrapper.unmount();
    });

    it('reports a failed delete and keeps the data view selected', async () => {
        const state = await getState();
        state.deleteDataView.mockRejectedValue(new Error('Store unavailable.'));
        const router = await buildRouter();
        const wrapper = await mountList(router);

        await wrapper.get('[data-test="delete"]').trigger('click');
        await settle();
        findDialogButton(t(DATA_VIEW_LIST_TEXT, 'delete.confirm.label')).click();
        await settle();

        expect(raiseAppFailure).toHaveBeenCalledOnce();
        expect(router.currentRoute.value.params.dataViewId).toBe('a');
        wrapper.unmount();
    });

    it('shows the Delete button as busy while a delete is under way', async () => {
        const state = await getState();
        const router = await buildRouter();
        const wrapper = await mountList(router);

        state.deleteIsPending.value = true;
        await settle();

        expect(wrapper.get('[data-test="delete"]').attributes('disabled')).toBeDefined();
        wrapper.unmount();
    });
});
