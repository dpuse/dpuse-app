<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import ModuleLinksPanel from '../components/ModuleLinksPanel.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import StudioDetailPanel from '@/studio/components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/studio/components/StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { toolLocalisedConfig } = defineProps<{
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    toolLocalisedConfig: LocalisedConfig<ToolConfig>;
}>();
defineEmits<{ clear: []; close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const toolStatus = computed(() => (toolLocalisedConfig.statusId ? getComponentStatus(toolLocalisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel data-region="ConnectorPanel">
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="toolLocalisedConfig.icon"
                :icon-dark="toolLocalisedConfig.iconDark"
                :overline="'Tools'"
                :title="toolLocalisedConfig.label"
                @clear="$emit('clear')"
                @close="$emit('close')"
            >
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
