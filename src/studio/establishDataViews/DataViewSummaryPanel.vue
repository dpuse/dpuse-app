<script setup lang="ts">
// ── External Dependencies & Registrations
import { CircleCheckIcon, CircleDashedIcon } from '@lucide/vue';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import T from './EstablishDataViews.json';
import { t } from '@/state/locale';

// ── Local Components - Static
import ScrollArea from '@/components/ui/ScrollArea.vue';
import StudioDetailPanel from '../StudioDetailPanel.vue';
import StudioDocumentPanel from '../StudioDocumentPanel.vue';

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
