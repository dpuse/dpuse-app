// External Dependencies
import { ref, type Ref } from 'vue';

// Types ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface StepConfig {
    id: string;
    disabled?: boolean;
    to?: string;
    verb?: string;
}

type Steps<T extends StepConfig> = {
    steps: Ref<T[]>;
};

// Composable ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function useSteps<T extends StepConfig>(initialItems: T[] = []): Steps<T> {
    const steps = ref([...initialItems]) as Ref<T[]>;

    return { steps };
}
