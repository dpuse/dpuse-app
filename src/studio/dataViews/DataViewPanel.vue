<script setup lang="ts">
// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Static Components
import DetailPanel from '../components/DetailPanel.vue';
import DocumentPanel from '@/studio/components/DocumentPanel.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewLocalisedConfig } = defineProps<{ dataViewLocalisedConfig: LocalisedConfig<DataViewConfig> }>();
defineEmits<{ clear: []; close: [] }>();
</script>

<template>
    <DetailPanel data-region="DataViewPanel">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <DocumentPanel :overline="'Establish Data Views'" :title="dataViewLocalisedConfig.label" @clear="$emit('clear')" @close="$emit('close')">
                <!-- Description -->
                <p v-if="dataViewLocalisedConfig.description">{{ dataViewLocalisedConfig.description }}</p>
                <p v-if="dataViewLocalisedConfig.description">Retrieves data from the 'XXX' [endpoint | file | table] using the 'YYY' connection.</p>

                {{ dataViewLocalisedConfig }}
            </DocumentPanel>
        </ScrollArea>
    </DetailPanel>
</template>
