// ── External Dependencies & Registrations
import { computed, type ComputedRef, type Ref, watch } from 'vue';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { useSetupRoute } from './useSetupRoute';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface SetupSelection<T> {
    activeItem: ComputedRef<T | undefined>;
    dataSource: ComputedRef<DataSource<T>>;
    selectItem: (item: T) => void;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// A setup list's selection lives in the route 'id' param, so a tab click that drops the param also clears it. Until
// 'isRetrievalFinalised', an empty list may only be pending, so the row count stays unknown and an unmatched id is kept.
export function useSetupSelection<T extends { id: string }>(
    items: Readonly<Ref<T[]>>,
    isRetrievalFinalised: () => boolean,
    isSelectable: (item: T) => boolean = () => true
): SetupSelection<T> {
    const { routeId, setRouteId } = useSetupRoute();

    const activeItem = computed(() => (routeId.value === undefined ? undefined : items.value.find((item) => isSelectable(item) && item.id === routeId.value)));
    const dataSource = computed<DataSource<T>>(() => ({ rowCount: isRetrievalFinalised() ? items.value.length : undefined, rows: items.value }));

    watch(
        [routeId, activeItem, isRetrievalFinalised],
        ([newRouteId, newActiveItem, newIsRetrievalFinalised]) => {
            if (newRouteId !== undefined && newActiveItem === undefined && newIsRetrievalFinalised) setRouteId(undefined);
        },
        { immediate: true }
    );

    function selectItem(item: T): void {
        setRouteId(activeItem.value?.id === item.id ? undefined : item.id);
    }

    return { activeItem, dataSource, selectItem };
}
