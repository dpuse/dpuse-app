<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '../ManageConfigLayout.vue';
import type { DataSource } from '@/composables/useDataWindow';
import { configsAreRetrieved, cookbookConfigs } from '@/state/session';
import { localeId, t } from '@/state/locale';

// ── Local Components - Static
import ConfigCard from '@/components/framework/ConfigCard.vue';
import CookbookPanel from './CookbookPanel.vue';
import GridDetailPanel from '@/components/framework/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Select_cookbook: { en: 'Select a Cookbook from the list.', es: 'Selecciona un recetario de la lista.' }
};

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

defineProps<{ activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeCookbookLocalisedConfig = shallowRef<LocalisedConfig<CookbookConfig> | undefined>();
const cookbookLocalisedConfigs = shallowRef<LocalisedConfig<CookbookConfig>[]>([]);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const cookbookConfigsDataSource = computed<DataSource<LocalisedConfig<CookbookConfig>>>(() => ({
    rowCount: configsAreRetrieved.value ? cookbookLocalisedConfigs.value.length : undefined,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<CookbookConfig>[] }> => Promise.resolve({ rows: cookbookLocalisedConfigs.value.slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(cookbookConfigs, (newCookbookConfigs) => (cookbookLocalisedConfigs.value = localiseConfigs<CookbookConfig>(newCookbookConfigs, localeId.value, true)), {
    immediate: true
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectCookbook(cookbookLocalisedConfig: LocalisedConfig<CookbookConfig> | undefined): void {
    activeCookbookLocalisedConfig.value = cookbookLocalisedConfig;
}
</script>

<template>
    <GridDetailPanel
        :active-item="activeCookbookLocalisedConfig"
        class="min-h-0 flex-1"
        :data-source="cookbookConfigsDataSource"
        max-detail-width="65ch"
        :row-height="122"
        @select="handleSelectCookbook"
    >
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" :selected="item.id === activeCookbookLocalisedConfig?.id" />
        </template>

        <template #detail="{ item, clear }">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <CookbookPanel :active-config-option-config="activeConfigOptionConfig" :cookbook-localised-config="item" @close="clear" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="t(T, 'Select_cookbook')" />
        </template>
    </GridDetailPanel>
</template>
