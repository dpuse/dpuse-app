<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { Action } from '@/components/ui/config/configCard';
import { t } from '@/state/locale';
import { TEXT } from './DataViewCard_.json';
import { constructDataViewSteps, type DataViewConnection } from '@/features/studio/dataViews/_state/dataViewSummary';
import { isDataViewLoaded, resolveDataViewStore } from '@/features/studio/dataViews/_state/dataViewStore';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import DataViewSource from '@/features/studio/dataViews/_components/DataViewSource.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewConnection, dataViewLocalisedConfig } = defineProps<{
    dataViewConnection: DataViewConnection | undefined; // Undefined until a connection is chosen.
    dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>;
}>();
const emit = defineEmits<{ open: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Progress ─ The description is read after the open action's name, so screen readers hear how far the data view
// has got.
const steps = computed(() => constructDataViewSteps(dataViewLocalisedConfig));
const progressDescription = computed(() => {
    const done = steps.value.filter((step) => step.state === 'done').length;
    return done === steps.value.length ? t(TEXT, 'progress.complete.text') : t(TEXT, 'progress.text', { done, total: steps.value.length });
});

// ── Store ─ Where the records are loaded, and whether they are there yet.
const store = computed(() => ({ ...resolveDataViewStore(dataViewLocalisedConfig), isLoaded: isDataViewLoaded(dataViewLocalisedConfig, false) }));

// ── Actions
const actions = computed((): Action<DataViewConfig>[] => [
    {
        typeId: 'open',
        description: progressDescription.value,
        label: t(TEXT, 'open.label', { name: dataViewLocalisedConfig.label }),
        onClick: (): void => {
            emit('open');
        }
    }
]);
</script>

<template>
    <!-- '@click', '@category-click', 'selected', 'is-inert' and 'detail-line-count' reach 'ConfigCard' by attribute
         fallthrough, so this must stay single-root. The details are four lines: the connection, the folder, the item and
         the store. -->
    <ConfigCard :actions="actions" :category-label="dataViewConnection?.categoryLabel" :config="dataViewLocalisedConfig" hides-icon>
        <template #details>
            <DataViewSource
                :connection-id="dataViewLocalisedConfig.connectionId"
                :connection-node-config="dataViewLocalisedConfig.connectionNodeConfig"
                :data-format-id="dataViewLocalisedConfig.readingConfig?.dataFormatId"
                :data-view-connection="dataViewConnection"
                is-folder-line-shown
                :item-type-id="dataViewConnection?.itemTypeId"
                :store="store"
            />
        </template>

        <!-- Audit ─ The connection and item lines show the first two steps, so only the audit is left to show. -->
        <template v-if="dataViewLocalisedConfig.contentAuditConfig?.isComplete !== true" #note>{{ t(TEXT, 'audit.pending.text') }}</template>
    </ConfigCard>
</template>
