// External Dependencies
import { ref, type Ref } from 'vue';

// Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface BreadcrumbConfig {
    id: string;
    label: string;
    to?: string;
}

type Breadcrumbs<T extends BreadcrumbConfig> = {
    breadcrumbs: Ref<T[]>;
    add: (item: T) => void;
    clearAfterIndex: (index: number) => void;
};

// Composable ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function useBreadcrumbs<T extends BreadcrumbConfig>(initialItems: T[] = []): Breadcrumbs<T> {
    const breadcrumbs = ref([...initialItems]) as Ref<T[]>;

    function add(item: T): void {
        breadcrumbs.value.push(item);
    }

    function clearAfterIndex(index: number): void {
        if (index < 0) return;
        breadcrumbs.value = breadcrumbs.value.slice(0, index + 1);
    }

    return { breadcrumbs, add, clearAfterIndex };
}
