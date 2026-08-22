<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';

// ── Local Framework
import type { ConfigOptionConfig } from '../ManageConfigLayout.vue';

// ── Local Components - Static
import ModuleLinksPanel from '../ModuleLinksPanel.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import StudioDetailPanel from '../../StudioDetailPanel.vue';
import StudioDocumentPanel from '../../StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { toolLocalisedConfig } = defineProps<{
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    toolLocalisedConfig: LocalisedConfig<ToolConfig>;
}>();
defineEmits<{ close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const toolStatus = computed(() => (toolLocalisedConfig.statusId ? getComponentStatus(toolLocalisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel data-region="ConnectorPanel">
        <ScrollArea scroll-area-padding="screen">
            <StudioDocumentPanel :overline="'Tools'" :title="toolLocalisedConfig.label" @close="$emit('close')">
                <!-- Tags -->
                <div class="mt-3 mb-6 flex flex-wrap gap-1.5">
                    <Tag :text="`v${toolLocalisedConfig.version}`" />
                    <Tag v-if="toolStatus" :text="toolLocalisedConfig.statusId ?? ''" :color="toolStatus.color" />
                </div>

                <!-- Description -->
                <p>{{ toolLocalisedConfig.description }}</p>

                <!-- Links -->
                <ModuleLinksPanel :localised-config="toolLocalisedConfig" />
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
