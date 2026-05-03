// External Dependencies
import { ref, type Ref } from 'vue';

// Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface TabConfig {
    id: string;
    label: string;
    to?: string;
}

type Tabs<T extends TabConfig> = {
    tabs: Ref<T[]>;
};

// Composable ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function useTabs<T extends TabConfig>(initialItems: T[] = []): Tabs<T> {
    const tabs = ref([...initialItems]) as Ref<T[]>;

    return { tabs };
}
