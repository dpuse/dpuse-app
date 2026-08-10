<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, shallowRef, watch } from 'vue';

// ── DPUse Framework
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';
import { localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── API Framework
import type { DataSource } from '@/composables/useDataWindow';
import { localeId } from '@/state/locale';
import { configsAreRetrieved, presenterConfigs } from '@/state/session';

// ── Local Components - Static
import ConfigCard from '@/components/framework/ConfigCard.vue';
import DetailActionBar from '@/components/framework/gridDetailPanel/DetailActionBar.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import PresenterForm from './PresenterForm.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activePresenterConfig = shallowRef<LocalisedConfig<PresenterConfig> | undefined>();
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
    activePresenterConfig.value = presenterLocalisedConfig;
}
</script>

<template>
    <GridDetailPanel :active-item="activePresenterConfig" class="min-h-0 flex-1" :data-source="presenterConfigsDataSource" max-detail-width="650px" @select="handleSelectPresenter">
        <template #grid-item="{ item }">
            <ConfigCard v-if="item" :config="item" />
        </template>

        <template #detail="{ item, clear }">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <PresenterForm :presenter-localised-config="item" />
                <DetailActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" @clear="clear" />
            </div>
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a presenter from the list.'" />
        </template>
    </GridDetailPanel>
</template>
