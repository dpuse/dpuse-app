// ── External Dependencies & Registrations
import { useConfirmDialog } from '@vueuse/core';
import { isNavigationFailure, NavigationFailureType, onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { type Ref, watch } from 'vue';
import type { RouteLocationNamedRaw, RouteLocationNormalized } from 'vue-router';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { accountConnectionsStatusTypeId } from '@/state/session';
import { ignoreReportedNavigationFailure } from '@/router';
import { isDataViewTaskRoute } from './_useDataViewTasks';
import { workspaceStoreId } from '@/services/workspaceStore';
import { configStatus, connectionLocalisedConfigs } from '@/state/configs';
import { constructDataViewsViewRoute, type DataViewsViewId, lastDataViewsViewId, NEW_DATA_VIEW_ID } from '@/features/studio/dataViews/_state/dataViews';
import { dataViewHasChanges, discardDataViewDraft } from '@/features/studio/dataViews/_state/dataViewDraft';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface DataViewRedirectsOptions {
    constructOpenDataViewRoute: (viewId: DataViewsViewId) => RouteLocationNamedRaw; // The diagram or list, with the open or selected data view selected.
    dataViewConfig: Readonly<Ref<DataViewConfig | undefined>>;
    dataViewIsNew: Readonly<Ref<boolean>>;
    routeIsTask: Readonly<Ref<boolean>>;
}

type ConfirmDialog = ReturnType<typeof useConfirmDialog>;

interface DataViewRedirects {
    cancelLeave: ConfirmDialog['cancel'];
    confirmLeave: ConfirmDialog['confirm'];
    leaveConfirmIsOpen: ConfirmDialog['isRevealed'];
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Where the user is sent when the data view on screen can no longer be worked on, and the question asked before they
// leave unsaved changes. The caller shows the question with 'leaveConfirmIsOpen', 'cancelLeave' and 'confirmLeave'.
export function useDataViewRedirects({ constructOpenDataViewRoute, dataViewConfig, dataViewIsNew, routeIsTask }: DataViewRedirectsOptions): DataViewRedirects {
    const route = useRoute();
    const router = useRouter();
    const { cancel: cancelLeave, confirm: confirmLeave, isRevealed: leaveConfirmIsOpen, reveal: revealLeaveConfirm } = useConfirmDialog();

    // Leaving a data view settles its changes, so the list never holds unsaved work. Moving between its steps keeps them.
    onBeforeRouteUpdate(canLeaveDataView);
    onBeforeRouteLeave(canLeaveDataView);

    // A data view being added exists only as a draft, so a later task reached by a reload has nothing to work on. It goes
    // back to the list. A saved data view always has a connection.
    watch(
        [dataViewIsNew, dataViewHasChanges, (): unknown => route.name],
        () => {
            void returnAbandonedDataViewToList();
        },
        { immediate: true }
    );

    // If the data view's connection disappears from the list (the user signed out, or its connector was removed), go
    // back to the data view list with its card selected, so its panel says the connection has gone. Only from a task,
    // since the list is where it goes. Not the diagram, which shows a data view only under its connection. Checked on
    // mount too, because it may have gone while the user was elsewhere. Nothing happens while the lists are still
    // loading, because a short list proves nothing then.
    watch(
        [connectionLocalisedConfigs, (): string | undefined => dataViewConfig.value?.connectionId],
        ([newConnectionLocalisedConfigs, newConnectionId]) => {
            if (
                newConnectionId == null ||
                !routeIsTask.value ||
                accountConnectionsStatusTypeId.value !== 'ready' ||
                configStatus.value.typeId !== 'ready' ||
                newConnectionLocalisedConfigs.some((config) => config.id === newConnectionId)
            )
                return;

            discardDataViewDraft(); // The connection has gone, so there is nothing left to ask about.
            void ignoreReportedNavigationFailure(router.replace(constructOpenDataViewRoute('list')));
        },
        { immediate: true }
    );

    // Signing in or out moves to another account's store, where the open or selected data view does not exist, so go
    // back to the diagram or list with nothing selected. The first store chosen after the session check is not a move.
    watch(workspaceStoreId, (_newWorkspaceStoreId, oldWorkspaceStoreId) => {
        if (oldWorkspaceStoreId == null || (!routeIsTask.value && (typeof route.params.dataViewId !== 'string' || route.params.dataViewId === ''))) return;

        discardDataViewDraft(); // The draft belongs to the account just left.
        void ignoreReportedNavigationFailure(router.replace(constructDataViewsViewRoute(lastDataViewsViewId.value, route.query)));
    });

    // Saving a new data view moves from 'new' to its real id, which is still the same data view. The diagram starts a
    // new data view on the list, with its connection already chosen, and then opens it: that draft is being entered, not
    // left.
    async function canLeaveDataView(to: RouteLocationNormalized): Promise<boolean> {
        const isSameDataView = String(to.params.dataViewId) === String(route.params.dataViewId) || String(to.params.dataViewId) === dataViewConfig.value?.id;
        const isEnteringNewDataView = to.params.dataViewId === NEW_DATA_VIEW_ID && !routeIsTask.value;
        if (isEnteringNewDataView || !dataViewHasChanges.value || (isSameDataView && isDataViewTaskRoute(to.name))) return true;

        const { isCanceled } = await revealLeaveConfirm();
        if (isCanceled) return false;

        discardDataViewDraft();
        return true;
    }

    // The app's own change to the query at startup cancels a navigation made at the same moment, so a cancelled one
    // tries again, once.
    async function returnAbandonedDataViewToList(isRetry = false): Promise<void> {
        if (route.name === 'connection' || !dataViewIsNew.value || dataViewHasChanges.value) return;

        try {
            const failure = await router.replace(constructDataViewsViewRoute(lastDataViewsViewId.value, route.query));
            if (!isRetry && isNavigationFailure(failure, NavigationFailureType.cancelled)) await returnAbandonedDataViewToList(true);
        } catch {
            // Already reported by 'router.onError'.
        }
    }

    return { cancelLeave, confirmLeave, leaveConfirmIsOpen };
}
