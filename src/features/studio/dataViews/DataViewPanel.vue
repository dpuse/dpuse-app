<script setup lang="ts">
// ── External Dependencies & Registrations
import { CircleCheckIcon, CircleIcon } from '@lucide/vue';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './DataViewPanel_.json';
import { type DataViewConnector, type DataViewStep, resolveDataViewStepLabel } from './dataViewSummary';

// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
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
</script>

<template>
    <StudioDetailPanel data-region="DataViewPanel">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="dataViewConnector?.icon ?? dataViewLocalisedConfig.icon"
                :icon-dark="dataViewConnector?.iconDark ?? dataViewLocalisedConfig.iconDark"
                :overline="t(TEXT, 'establishDataViews.label')"
                :title="dataViewLocalisedConfig.label"
                @close="$emit('close')"
            >
                <template v-if="dataViewConnector" #tags>
                    <Tag :text="dataViewConnector.categoryLabel" />
                </template>

                <!-- Description -->
                <p v-if="dataViewLocalisedConfig.description">{{ dataViewLocalisedConfig.description }}</p>

                <StudioDocumentSection :title="t(TEXT, 'connection.title')">
                    <p v-if="dataViewConnector">{{ t(TEXT, 'connection.text', { connector: dataViewConnector.label }) }}</p>
                    <p v-else>{{ t(TEXT, 'noConnection.text') }}</p>
                </StudioDocumentSection>

                <!-- Same blues as the card's step dots, so the two read as the same progress. -->
                <StudioDocumentSection :title="t(TEXT, 'progress.title')">
                    <ul>
                        <li v-for="step in dataViewSteps" :key="step.id" class="flex items-center gap-x-2">
                            <CircleCheckIcon v-if="step.state === 'done'" aria-hidden="true" class="size-4 flex-none text-blue-500 dark:text-blue-400" />
                            <CircleIcon v-else aria-hidden="true" class="size-4 flex-none text-blue-500 dark:text-blue-400" />
                            <span class="sr-only">{{ t(TEXT, `step.${step.state}.aria`) }}:</span>
                            {{ resolveDataViewStepLabel(step.id) }}
                        </li>
                    </ul>
                </StudioDocumentSection>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
