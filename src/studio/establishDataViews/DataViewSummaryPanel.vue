<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { CircleCheckIcon, CircleDashedIcon } from '@lucide/vue';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import T from './EstablishDataViews.json';
import { t } from '@/state/locale';

// ── Local Components - Static
import ScrollArea from '@/components/ui/ScrollArea2.vue';
import StudioDetailPanel from '../StudioDetailPanel.vue';
import StudioDocumentPanel from '../StudioDocumentPanel.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { dataViewLocalisedConfig } = defineProps<{ dataViewLocalisedConfig: LocalisedConfig<DataViewConfig> }>();
defineEmits<{ clear: []; submit: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Mirrors the step gating in DataViewList's routing logic — the first unmet step is where "Continue" resumes.
const progressSteps = computed(() => [
    { id: 'connection', label: t(T, 'Connection'), isComplete: dataViewLocalisedConfig.connectionId != null },
    { id: 'item', label: t(T, 'Item'), isComplete: dataViewLocalisedConfig.connectionNodeConfig != null },
    { id: 'content', label: t(T, 'Content'), isComplete: dataViewLocalisedConfig.contentAuditConfig != null },
    { id: 'data', label: t(T, 'Data'), isComplete: false }
]);
</script>

<template>
    <StudioDetailPanel data-region="DataViewSummaryPanel">
        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <StudioDocumentPanel :overline="'Establish Data Views'" :title="dataViewLocalisedConfig.label" @close="$emit('clear')">
                <!-- Description -->
                <!-- <p v-if="dataViewLocalisedConfig.description">{{ dataViewLocalisedConfig.description }}</p> -->
                <p v-if="dataViewLocalisedConfig.description">Retrieves data from the XXX object via the YYYY connection 'ZZZ Connection'.</p>

                <!-- Setup Progress -->
                <h2>{{ t(T, 'Setup_progress') }}</h2>
                <ul>
                    <li v-for="step in progressSteps" :key="step.id" class="flex items-center gap-x-2">
                        <CircleCheckIcon v-if="step.isComplete" class="size-4 flex-none text-green-600 dark:text-green-500" :stroke-width="1.5" />
                        <CircleDashedIcon v-else class="size-4 flex-none text-muted" :stroke-width="1.5" />
                        {{ step.label }}
                    </li>
                </ul>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
