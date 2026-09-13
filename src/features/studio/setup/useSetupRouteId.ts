// ── External Dependencies & Registrations
import { computed, type ComputedRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useSetupRouteId(): { routeId: ComputedRef<string | undefined>; setRouteId: (id?: string) => void } {
    const route = useRoute();
    const router = useRouter();

    const routeId = computed(() => (typeof route.params.id === 'string' ? route.params.id : undefined));

    function setRouteId(id?: string): void {
        void router.replace({ name: route.name ?? undefined, params: { id }, query: route.query }).catch(() => {
            // Already reported by 'router.onError'.
        });
    }

    return { routeId, setRouteId };
}
