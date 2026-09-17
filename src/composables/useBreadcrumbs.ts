// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';
import { ref, type Ref } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface BreadcrumbConfig {
    id: string;
    label: string;
    icon?: unknown;
    to?: RouteLocationRaw;
}

interface Breadcrumbs<T extends BreadcrumbConfig> {
    breadcrumbs: Ref<T[]>;
    add: (item: T) => void;
    clearAfterIndex: (index: number) => void;
    removeLast: () => void;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useBreadcrumbs<T extends BreadcrumbConfig>(initialItems: T[] = []): Breadcrumbs<T> {
    const breadcrumbs = ref([...initialItems]) as Ref<T[]>;

    function add(item: T): void {
        breadcrumbs.value.push(item);
    }

    function clearAfterIndex(index: number): void {
        if (index < 0) return;
        breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
    }

    function removeLast(): void {
        breadcrumbs.value = breadcrumbs.value.slice(0, -1);
    }

    return { breadcrumbs, add, clearAfterIndex, removeLast };
}
