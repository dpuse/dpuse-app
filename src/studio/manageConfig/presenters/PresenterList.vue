<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';
import type { DataSource } from '@/composables/useDataWindow';
import { configsAreRetrieved, presenterConfigs } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ConfigCard from '@/components/ui/ConfigCard.vue';
import GridDetailPanel from '@/components/ui/GridDetailPanel.vue';
import PresenterPanel from './PresenterPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Select_presenter: { en: 'Select a presenter from the list.', es: 'Selecciona un presentador de la lista.' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineProps<{ activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activePresenterLocalisedConfig = shallowRef<LocalisedConfig<PresenterConfig> | undefined>();
const presenterLocalisedConfigs = shallowRef<LocalisedConfig<PresenterConfig>[]>([]);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const presenterConfigsDataSource = computed<DataSource<LocalisedConfig<PresenterConfig>>>(() => ({
    rowCount: configsAreRetrieved.value ? presenterLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<PresenterConfig>[] }> => Promise.resolve({ rows: presenterLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(presenterConfigs, (newPresenterConfigs) => (presenterLocalisedConfigs.value = localiseConfigs<PresenterConfig>(newPresenterConfigs, localeId.value, true)), {
    immediate: true
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectPresenter(presenterLocalisedConfig: LocalisedConfig<PresenterConfig> | undefined): void {
    activePresenterLocalisedConfig.value = presenterLocalisedConfig;
}
</script>

<template>
    <GridDetailPanel
        :active-item="activePresenterLocalisedConfig"
        class="min-h-0 flex-1"
        :data-source="presenterConfigsDataSource"
        max-detail-width="65ch"
        :row-height="122"
        @select="handleSelectPresenter"
    >
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" :selected="item.id === activePresenterLocalisedConfig?.id" />
        </template>

        <template #detail="{ item, clear }">
            <PresenterPanel :active-config-option-config="activeConfigOptionConfig" :presenter-localised-config="item" @close="clear" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, 'Select_presenter')" />
        </template>
    </GridDetailPanel>
</template>
