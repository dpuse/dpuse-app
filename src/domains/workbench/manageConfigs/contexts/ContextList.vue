<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── Local Framework
import type { ComponentReference } from '@dpuse/dpuse-shared/component';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/context';
import type { ContextModelConfig } from '@dpuse/dpuse-shared/component/context/model';
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';
import { localiseConfig, type LocalisedConfig, localiseReference } from '@dpuse/dpuse-shared/locale';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

import contextConfigData from './contextConfig.json';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeModelReference = shallowRef<LocalisedConfig<ComponentReference> | undefined>();
const contextConfig = shallowRef<ContextConfig>(contextConfigData as ContextConfig);

const contextLocalisedConfig = shallowRef<LocalisedConfig<ContextConfig>>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const modelReferencesDataSource = computed<DataSource<LocalisedConfig<ComponentReference>>>(() => getModels());

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(contextConfig, (newContextConfig) => (contextLocalisedConfig.value = localiseConfig<ContextConfig>(newContextConfig, localeId.value)), {
    immediate: true
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSelectModel(modelReference: LocalisedConfig<ComponentReference> | undefined): Promise<void> {
    console.log(111, modelReference);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getModels(): DataSource<LocalisedConfig<ComponentReference>> {
    const localisedModels: LocalisedConfig<ComponentReference>[] = [];
    for (const area of contextConfig.value.areas) {
        for (const model of area.models) {
            const lr = localiseReference(model, localeId.value);
            localisedModels.push(lr);
        }
    }
    return {
        rowCount: localisedModels.length,
        // getRows: (start, end): Promise<{ rows: LocalisedConfig<FocusConfig>[] }> => Promise.resolve({ rows: contextLocalisedConfigs.value?.areas.slice(start, end) })
        getRows: (start, end): Promise<{ rows: LocalisedConfig<ComponentReference>[] }> => Promise.resolve({ rows: localisedModels })
    };
}
</script>

<template>
    <GridDetailPanel
        :active-item="activeModelReference"
        class="min-h-0 flex-1"
        :data-source="modelReferencesDataSource"
        :is-compact="true"
        max-list-width="350px"
        @select="handleSelectModel($event)"
    >
        <template #grid-item="{ item }">
            <Card v-if="item" :icon="item.icon ?? undefined" :is-compact="true" :label="item.label" />
        </template>

        <template #detail>
            <div ref="container" class="dpuse-text overflow-y-scroll overscroll-y-none px-4 pt-4" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a focus from the list.'" />
        </template>
    </GridDetailPanel>
</template>
