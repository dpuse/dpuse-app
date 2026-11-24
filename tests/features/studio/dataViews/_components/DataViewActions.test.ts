// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import { enableAutoUnmount, mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import DataViewActions from '@/features/studio/dataViews/_components/DataViewActions.vue';
import { draftDataViewConfig } from '@/features/studio/dataViews/_state/dataViewDraft';
import { raiseAppFailure } from '@/state/errors';
import { settle } from '~/tests/support/settle';
import { DATA_VIEW_ADD_ACTION_ID, DATA_VIEW_SCROLL_ACTIONS_ID, DATA_VIEW_STEP_ACTION_ID } from '@/features/studio/dataViews/_state/dataViews';

// Unmounts after each test, so the dialog of one test is never found by the next.
enableAutoUnmount(afterEach);

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));
vi.mock('@/state/errors', async (importOriginal) => ({ ...(await importOriginal<object>()), raiseAppFailure: vi.fn() }));

// A draft's records are kept in a store the tests do not open, so whether records are loading is a ref a test can set.
vi.mock('@/features/studio/dataViews/_state/dataViewStore', async () => {
    const { ref } = await import('vue');
    return { dataViewRecordsAreLoading: ref(false), forgetDraftLoad: vi.fn(), promoteDraftLoad: vi.fn() };
});

// Save writes through this mutation, so a test decides whether it is running and whether it succeeds.
vi.mock('@/features/studio/dataViews/_state/dataViews', async (importOriginal) => {
    const { ref } = await import('vue');
    const state = { isPending: ref(false), mutateAsync: vi.fn<(dataViewConfig: DataViewConfig) => Promise<DataViewConfig>>() };
    return { ...(await importOriginal<object>()), useUpdateDataView: (): object => state, stateForTest: state };
});

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface StateForTest {
    isPending: { value: boolean };
    mutateAsync: ReturnType<typeof vi.fn<(dataViewConfig: DataViewConfig) => Promise<DataViewConfig>>>;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONNECTION_ONLY_DATA_VIEW = buildDataView(false); // A changed connection with no item open yet.
const PREVIEWED_DATA_VIEW = buildDataView(true); // An item open and previewed, so a whole data view.

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('DataViewActions', () => {
    beforeEach(async () => {
        draftDataViewConfig.value = undefined;
        await setRecordsAreLoading(false);
        const state = await getState();
        state.isPending.value = false;
        state.mutateAsync.mockReset();
        vi.mocked(raiseAppFailure).mockClear();
    });

    it('holds the places where a step puts its scroll buttons, its add action and its own action', async () => {
        const wrapper = await mountActions(await buildRouter(), PREVIEWED_DATA_VIEW, false);

        expect(wrapper.find(`#${DATA_VIEW_SCROLL_ACTIONS_ID}`).exists()).toBe(true);
        expect(wrapper.find(`#${DATA_VIEW_ADD_ACTION_ID}`).exists()).toBe(true);
        expect(wrapper.find(`#${DATA_VIEW_STEP_ACTION_ID}`).exists()).toBe(true);
    });

    describe('dimmed', () => {
        it('dims both actions with nothing to save, and says why', async () => {
            const wrapper = await mountActions(await buildRouter(), PREVIEWED_DATA_VIEW, false);

            expect(readAction(wrapper, 'Discard')).toStrictEqual({ isDisabled: true, title: 'No changes to discard' });
            expect(readAction(wrapper, 'Save')).toStrictEqual({ isDisabled: true, title: 'No changes to save' });
        });

        it('lets a change of connection be discarded, but not saved until an item is open', async () => {
            draftDataViewConfig.value = CONNECTION_ONLY_DATA_VIEW;
            const wrapper = await mountActions(await buildRouter(), CONNECTION_ONLY_DATA_VIEW, false);

            expect(readAction(wrapper, 'Discard').isDisabled).toBe(false);
            expect(readAction(wrapper, 'Save')).toStrictEqual({ isDisabled: true, title: 'Open an item before saving' });
        });

        it('dims both actions while records load', async () => {
            draftDataViewConfig.value = PREVIEWED_DATA_VIEW;
            await setRecordsAreLoading(true);
            const wrapper = await mountActions(await buildRouter(), PREVIEWED_DATA_VIEW, false);

            expect(readAction(wrapper, 'Discard')).toStrictEqual({ isDisabled: true, title: 'Wait for the records to load, or stop the load' });
            expect(readAction(wrapper, 'Save')).toStrictEqual({ isDisabled: true, title: 'Wait for the records to load, or stop the load' });
        });

        it('dims Save while it runs, with no reason given', async () => {
            draftDataViewConfig.value = PREVIEWED_DATA_VIEW;
            const state = await getState();
            state.isPending.value = true;
            const wrapper = await mountActions(await buildRouter(), PREVIEWED_DATA_VIEW, false);

            expect(readAction(wrapper, 'Save')).toStrictEqual({ isDisabled: true, title: 'Save' });
        });
    });

    describe('save', () => {
        it('stores the data view and clears its changes', async () => {
            draftDataViewConfig.value = PREVIEWED_DATA_VIEW;
            const state = await getState();
            state.mutateAsync.mockResolvedValue(PREVIEWED_DATA_VIEW);
            const router = await buildRouter('/dataViews/a/items?sView=items');
            const wrapper = await mountActions(router, PREVIEWED_DATA_VIEW, false);

            await wrapper.find('button[aria-label="Save"]').trigger('click');
            await settle();

            expect(state.mutateAsync).toHaveBeenCalledWith(PREVIEWED_DATA_VIEW);
            expect(draftDataViewConfig.value).toBeUndefined();
            expect(router.currentRoute.value.fullPath).toBe('/dataViews/a/items?sView=items');
        });

        it('moves a new data view to its own id, keeping the query', async () => {
            draftDataViewConfig.value = PREVIEWED_DATA_VIEW;
            const state = await getState();
            state.mutateAsync.mockResolvedValue(PREVIEWED_DATA_VIEW);
            const router = await buildRouter('/dataViews/new/items?sView=items');
            const wrapper = await mountActions(router, PREVIEWED_DATA_VIEW, true);

            await wrapper.find('button[aria-label="Save"]').trigger('click');
            await settle();

            expect(router.currentRoute.value.fullPath).toBe('/dataViews/a/items?sView=items');
        });

        it('reports a failed save and keeps the changes, so the user can try again', async () => {
            draftDataViewConfig.value = PREVIEWED_DATA_VIEW;
            const state = await getState();
            state.mutateAsync.mockRejectedValue(new Error('Store unavailable.'));
            const wrapper = await mountActions(await buildRouter(), PREVIEWED_DATA_VIEW, false);

            await wrapper.find('button[aria-label="Save"]').trigger('click');
            await settle();

            expect(raiseAppFailure).toHaveBeenCalledOnce();
            expect(vi.mocked(raiseAppFailure).mock.calls[0]?.[0]).toMatchObject({ locator: 'dpuse-app.DataViewActions.handleSaveDataView' });
            expect(draftDataViewConfig.value).toBe(PREVIEWED_DATA_VIEW);
        });
    });

    describe('discard', () => {
        it('asks first, and keeps the changes when the user cancels', async () => {
            draftDataViewConfig.value = PREVIEWED_DATA_VIEW;
            const wrapper = await mountActions(await buildRouter(), PREVIEWED_DATA_VIEW, false);

            await wrapper.find('button[aria-label="Discard"]').trigger('click');
            await settle();
            expect(findDialog().textContent).toContain('Your changes will be lost, and the saved data view stays as it was.');
            findDialogButton('Cancel').click();
            await settle();

            expect(draftDataViewConfig.value).toBe(PREVIEWED_DATA_VIEW);
            expect(wrapper.emitted('discarded')).toBeUndefined();
        });

        it('clears the changes once confirmed, and tells the caller', async () => {
            draftDataViewConfig.value = PREVIEWED_DATA_VIEW;
            const wrapper = await mountActions(await buildRouter(), PREVIEWED_DATA_VIEW, false);

            await wrapper.find('button[aria-label="Discard"]').trigger('click');
            await settle();
            findDialogButton('Discard').click();
            await settle();

            expect(draftDataViewConfig.value).toBeUndefined();
            expect(wrapper.emitted('discarded')).toHaveLength(1);
        });

        it('warns that a new data view will be lost', async () => {
            draftDataViewConfig.value = PREVIEWED_DATA_VIEW;
            const wrapper = await mountActions(await buildRouter('/dataViews/new/items'), PREVIEWED_DATA_VIEW, true);

            await wrapper.find('button[aria-label="Discard"]').trigger('click');
            await settle();

            expect(findDialog().textContent).toContain('This data view has not been saved, so it will be lost.');
        });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildDataView(isPreviewed: boolean): DataViewConfig {
    return {
        id: 'a',
        label: { en: 'Sales' },
        description: {},
        icon: null,
        iconDark: null,
        typeId: 'dataView',
        connectionId: 'work',
        ...(isPreviewed && { connectionNodeConfig: { folderPath: '/reports', label: 'sales.csv' }, sampleConfig: {} })
    } as DataViewConfig;
}

// Save moves a new data view to its id on the route it is on, so the item task is the one route needed.
async function buildRouter(path = '/dataViews/a/items'): Promise<Router> {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ name: 'item', path: '/dataViews/:dataViewId/items', component: { render: (): null => null } }] });
    await router.push(path);
    await router.isReady();
    return router;
}

async function mountActions(router: Router, dataViewConfig: DataViewConfig, isNewDataView: boolean): Promise<VueWrapper> {
    const wrapper = mount(DataViewActions, {
        attachTo: document.body, // The dialog is found in the document, where 'showModal' opens it.
        global: { plugins: [router] },
        props: { dataViewConfig, dataViewIsNew: isNewDataView }
    });
    await settle();
    return wrapper;
}

function readAction(wrapper: VueWrapper, label: string): { isDisabled: boolean; title: string | undefined } {
    const button = wrapper.find(`button[aria-label="${label}"]`);
    return { isDisabled: button.attributes('disabled') != null, title: button.attributes('title') };
}

function findDialog(): HTMLElement {
    const dialog = document.querySelector<HTMLElement>('[data-region="ConfirmDialog"]');
    if (!dialog) throw new Error('No confirm dialog is open.');
    return dialog;
}

function findDialogButton(label: string): HTMLButtonElement {
    const button = [...findDialog().querySelectorAll('button')].find((candidate) => candidate.textContent.trim() === label);
    if (!button) throw new Error(`The confirm dialog has no '${label}' button.`);
    return button;
}

async function getState(): Promise<StateForTest> {
    const module_ = (await import('@/features/studio/dataViews/_state/dataViews')) as unknown as { stateForTest: StateForTest };
    return module_.stateForTest;
}

async function setRecordsAreLoading(isLoading: boolean): Promise<void> {
    const module_ = (await import('@/features/studio/dataViews/_state/dataViewStore')) as unknown as { dataViewRecordsAreLoading: { value: boolean } };
    module_.dataViewRecordsAreLoading.value = isLoading;
}
