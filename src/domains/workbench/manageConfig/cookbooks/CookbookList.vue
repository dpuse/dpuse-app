<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';
import { cookbookConfigs } from '@/state/session';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import CookbookForm from './CookbookForm.vue';
import DetailActionBar from '@/components/framework/gridDetailPanel/DetailActionBar.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeCookbookConfig = shallowRef<LocalisedConfig<CookbookConfig> | undefined>();
const cookbookLocalisedConfigs = shallowRef<LocalisedConfig<CookbookConfig>[]>([]);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const cookbookConfigsDataSource = computed<DataSource<LocalisedConfig<CookbookConfig>>>(() => ({
    rowCount: cookbookLocalisedConfigs.value.length,
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
            <Card v-if="item" :icon="item.icon ?? undefined" :icon-dark="item.iconDark ?? undefined" :label="item.label" />
        </template>

        <template #detail="{ item, clear }">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <CookbookForm :cookbook-localised-config="item" />
                <DetailActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" @clear="clear" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a Cookbook from the list.'" />
        </template>
    </GridDetailPanel>
</template>
