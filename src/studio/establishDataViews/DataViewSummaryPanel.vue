<script setup lang="ts">
// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Static Components
import ScrollArea from '@/components/ui/ScrollArea.vue';
import StudioDetailPanel from '../components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/studio/components/StudioDocumentPanel.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewLocalisedConfig } = defineProps<{ dataViewLocalisedConfig: LocalisedConfig<DataViewConfig> }>();
defineEmits<{ close: [] }>();
</script>

<template>
    <StudioDetailPanel data-region="DataViewSummaryPanel">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel :overline="'Establish Data Views'" :title="dataViewLocalisedConfig.label" @close="$emit('close')">
                <!-- Description -->
                <p v-if="dataViewLocalisedConfig.description">{{ dataViewLocalisedConfig.description }}</p>
                <p v-if="dataViewLocalisedConfig.description">Retrieves data from the 'XXX' [endpoint | file | table] using the 'YYY' connection.</p>

                {{ dataViewLocalisedConfig }}
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
