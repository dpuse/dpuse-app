<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';
import { configsAreRetrieved, cookbookConfigs } from '@/state/session';

// ── Local Components - Static
import ConfigCard from '@/components/framework/ConfigCard.vue';
import CookbookForm from './CookbookForm.vue';
import GridDetailPanel from '~/src/components/framework/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import StepActionButton from '~/src/components/ui/button/StepActionButton.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeCookbookConfig = shallowRef<LocalisedConfig<CookbookConfig> | undefined>();
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
    activeCookbookConfig.value = cookbookLocalisedConfig;
}
</script>

<template>
    <GridDetailPanel :active-item="activeCookbookConfig" class="min-h-0 flex-1" :data-source="cookbookConfigsDataSource" max-detail-width="650px" @select="handleSelectCookbook">
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" />
        </template>

        <template #detail="{ item, clear }">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <CookbookForm :cookbook-localised-config="item" />
                <StepActionButton label="Select" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a Cookbook from the list.'" />
        </template>
    </GridDetailPanel>
</template>
