<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, shallowRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { ContextModelConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { contextConfig } from '@/state/configs';
import { establishContextModelConfig } from '@/state/contextModels';
import { raiseAppFailure } from '@/state/errors';
import { TEXT } from './ContextSearch_.json';
import { constructContextSearchEntries, type ContextSearchEntry } from './_contextDiagram';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ComboboxInput from '@/components/ui/ComboboxInput.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineEmits<{ select: [entry: ContextSearchEntry] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The models whose entities and events can be found, by model id. Replaced whole as each model arrives, so the options
// are built again.
const modelConfigsById = shallowRef<ReadonlyMap<string, ContextModelConfig>>(new Map());
const modelsAreRequested = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Each option says what kind of thing it is and what it belongs to, because many events share a name, such as
// 'Deletion'. Built here so the phrases follow the language.
const entries = computed(() => (contextConfig.value == null ? [] : constructContextSearchEntries(contextConfig.value, localeId.value, modelConfigsById.value)));
const options = computed(() => entries.value.map((entry) => ({ ...entry, label: constructOptionLabel(entry) })));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Every model is loaded the first time the search is used, not when the screen opens, because the entities and events
// are only needed by a search. Areas and models can be found straight away, and the rest as each model arrives.
function handleRequestModels(): void {
    if (modelsAreRequested.value || contextConfig.value == null) return;
    modelsAreRequested.value = true;

    const modelIds = new Set(contextConfig.value.areas.flatMap((areaConfig) => areaConfig.models.map((modelReferenceConfig) => modelReferenceConfig.id)));
    for (const modelId of modelIds) void loadModel(modelId);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadModel(modelId: string): Promise<void> {
    try {
        const modelConfig = await establishContextModelConfig(modelId);
        if (modelConfig) modelConfigsById.value = new Map(modelConfigsById.value).set(modelId, modelConfig);
    } catch (error) {
        // Announced rather than shown in the search, which still finds everything else.
        raiseAppFailure(new AppError(`Failed to load context model '${modelId}'.`, 'dpuse-app.ContextSearch.loadModel', { data: { typeId: 'handled' }, cause: error }));
    }
}

function constructOptionLabel(entry: ContextSearchEntry): string {
    switch (entry.typeId) {
        case 'area':
            return t(TEXT, 'option.area.text', { area: entry.areaLabel });
        case 'model':
            return t(TEXT, 'option.model.text', { area: entry.areaLabel, model: entry.modelLabel ?? '' });
        case 'entity':
            return t(TEXT, 'option.entity.text', { entity: entry.entityLabel ?? '', model: entry.modelLabel ?? '' });
        case 'event':
            return t(TEXT, 'option.event.text', { entity: entry.entityLabel ?? '', event: entry.eventLabel ?? '' });
    }
}
</script>

<template>
    <ComboboxInput
        :empty-text="t(TEXT, 'search.empty.text')"
        :label="t(TEXT, 'search.aria')"
        :options="options"
        :placeholder="t(TEXT, 'search.placeholder')"
        @focusin="handleRequestModels"
        @select="$emit('select', $event)"
    />
</template>
