<script setup lang="ts">
// ── DPUse Framework
import type { DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './DataViewPanel_.json';
import type { DataViewConnector, DataViewStep, DataViewStepId } from './dataViewSummary';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StepDot from '@/components/ui/StepDot.vue';
import StepDots from '@/components/ui/StepDots.vue';
import StudioDetailPanel from '../_components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewConnector, dataViewLocalisedConfig, dataViewSteps } = defineProps<{
    dataViewConnector: DataViewConnector | undefined; // Undefined until a connection is chosen.
    dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>;
    dataViewSteps: DataViewStep[];
}>();
defineEmits<{ close: [] }>();

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function formatCount(count: number): string {
    return new Intl.NumberFormat(localeId.value).format(count);
}

function resolveStepState(stepId: DataViewStepId): DataViewStep['state'] {
    return dataViewSteps.find((step) => step.id === stepId)?.state ?? 'pending';
}
</script>

<template>
    <StudioDetailPanel data-region="DataViewPanel">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="dataViewConnector?.icon ?? dataViewLocalisedConfig.icon"
                :icon-dark="dataViewConnector?.iconDark ?? dataViewLocalisedConfig.iconDark"
                :overline="dataViewConnector?.label ?? t(TEXT, 'noConnection.label')"
                :title="dataViewLocalisedConfig.label"
                @close="$emit('close')"
            >
                <!-- The card's step dots beside the category, so the panel opens with the same summary the card shows. -->
                <template #tags>
                    <Tag v-if="dataViewConnector" :text="dataViewConnector.categoryLabel" />
                    <StepDots class="h-6" :steps="dataViewSteps" />
                </template>

                <!-- Description -->
                <p v-if="dataViewLocalisedConfig.description">{{ dataViewLocalisedConfig.description }}</p>

                <!-- One section per step, each headed by the card's dot for that step and holding what the step produced. A
                     step done without a result to show says so plainly. -->
                <StudioDocumentSection :title="t(TEXT, 'connection.title')">
                    <template #icon>
                        <StepDot class="size-4" :state="resolveStepState('connection')" />
                    </template>
                    <p v-if="dataViewConnector">{{ t(TEXT, 'connection.text', { connector: dataViewConnector.label }) }}</p>
                    <p v-else>{{ t(TEXT, resolveStepState('connection') === 'done' ? 'done.text' : 'notDone.text') }}</p>
                </StudioDocumentSection>

                <StudioDocumentSection :title="t(TEXT, 'item.title')">
                    <template #icon>
                        <StepDot class="size-4" :state="resolveStepState('item')" />
                    </template>
                    <p v-if="dataViewLocalisedConfig.connectionNodeConfig">{{ t(TEXT, 'item.text', { item: dataViewLocalisedConfig.connectionNodeConfig.label }) }}</p>
                    <p v-else>{{ t(TEXT, resolveStepState('item') === 'done' ? 'done.text' : 'notDone.text') }}</p>
                </StudioDocumentSection>

                <StudioDocumentSection :title="t(TEXT, 'contentAudit.title')">
                    <template #icon>
                        <StepDot class="size-4" :state="resolveStepState('content')" />
                    </template>
                    <ul v-if="dataViewLocalisedConfig.contentAuditConfig">
                        <li>{{ t(TEXT, 'records.label') }}: {{ formatCount(dataViewLocalisedConfig.contentAuditConfig.recordCount) }}</li>
                        <li>{{ t(TEXT, 'columns.label') }}: {{ formatCount(dataViewLocalisedConfig.contentAuditConfig.columns.length) }}</li>
                    </ul>
                    <p v-else>{{ t(TEXT, resolveStepState('content') === 'done' ? 'done.text' : 'notDone.text') }}</p>
                </StudioDocumentSection>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
