// ── External Dependencies & Registrations
import { promiseTimeout } from '@vueuse/core';
import { type MaybeRefOrGetter, toValue } from 'vue';
import { useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

// ── DPUse Framework
import { DEFAULT_LOCALE_ID } from '@dpuse/dpuse-shared';
import type { ContextModelConfig, LocaleId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { queryClient } from '@/services/queryClient';

// ── Data ─ Stands in for a real endpoint until one exists. See 'loadContextModelConfig'.
import modelConfigsData from '@/features/studio/setup/context/_data/modelConfigs.json';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// A context model for reading only, such as naming the entity and event an event query is for. Loaded once and shared
// by every reader, so the result must not be edited: a screen that edits a model loads its own copy with
// 'loadContextModelConfig'. The model is null when the context has none with that id.
export function useContextModel(modelId: MaybeRefOrGetter<string | undefined>): UseQueryReturnType<ContextModelConfig | null, Error> {
    return useQuery(() => constructContextModelQueryOptions(toValue(modelId)));
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The same shared, read-only model as 'useContextModel', for code that is not in a component's setup.
export async function establishContextModelConfig(modelId: string): Promise<ContextModelConfig | null> {
    return queryClient.query(constructContextModelQueryOptions(modelId));
}

export async function loadContextModelConfig(modelId: string): Promise<ContextModelConfig | undefined> {
    // Future: return (await fetch(`/api/model-configs/${modelId}`)).json() as Promise<ContextModelConfig | undefined>;
    await promiseTimeout(400); // Simulates the network latency the real fetch above will have.
    const modelConfig = (modelConfigsData as unknown as Record<string, ContextModelConfig | undefined>)[modelId];
    return modelConfig ? structuredClone(modelConfig) : undefined; // A copy, as a fetch would return, so edits don't write into the imported JSON.
}

// 'label'/'description' are locale maps, but not always: some primary measures (e.g. 'personLanguage') give a plain
// string instead. 'description' can also be absent entirely on data items, events, and primary measures whose type
// declares it optional — this still has to cope with that being 'undefined' at runtime. A missing translation falls
// back to the default locale, as 'localiseConfig' does.
export function localiseText(value: string | Partial<Record<string, string>> | undefined, localeId: LocaleId): string {
    return typeof value === 'string' ? value : (value?.[localeId] ?? value?.[DEFAULT_LOCALE_ID] ?? '');
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// TanStack Query does not accept undefined as a result, so a model that does not exist is null.
function constructContextModelQueryOptions(modelId: string | undefined): {
    enabled: boolean;
    queryFn: () => Promise<ContextModelConfig | null>;
    queryKey: readonly ['contextModel', string | undefined];
    staleTime: number;
} {
    return {
        enabled: modelId != null,
        queryFn: async () => (modelId == null ? null : ((await loadContextModelConfig(modelId)) ?? null)),
        queryKey: ['contextModel', modelId],
        staleTime: Infinity
    };
}
