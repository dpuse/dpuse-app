// ── External Dependencies & Registrations
import { computed, type ComputedRef } from 'vue';
import { type RouteRecordNameGeneric, useRoute, useRouter } from 'vue-router';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface SetupRoute {
    routeId: ComputedRef<string | undefined>;
    routeName: ComputedRef<RouteRecordNameGeneric>;
    setRouteId: (id?: string) => void;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// The active route name and 'id' param shared by every tab route under 'SetupLayout'. 'setRouteId' replaces only
// 'id', keeping the current route's name and query unchanged.
export function useSetupRoute(): SetupRoute {
    const route = useRoute();
    const router = useRouter();

    const routeId = computed(() => (typeof route.params.id === 'string' ? route.params.id : undefined));
    const routeName = computed(() => route.name);

    function setRouteId(id?: string): void {
        void router.replace({ name: route.name ?? undefined, params: { id }, query: route.query }).catch(() => {
            // Already reported by 'router.onError'.
        });
    }

    return { routeId, routeName, setRouteId };
}
