<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';
import { t } from '@/state/locale';

// ── Static Components
import ModuleLinksPanel from '@/studio/manageConfig/components/ModuleLinksPanel.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import StudioDetailPanel from '@/studio/components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/studio/components/StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    presenterLocalisedConfig: LocalisedConfig<PresenterConfig>;
}
const { activeConfigOptionConfig, presenterLocalisedConfig } = defineProps<Properties>();

defineEmits<{ clear: []; close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const presenterStatus = computed(() => (presenterLocalisedConfig.statusId ? getComponentStatus(presenterLocalisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel data-region="PresenterPanel">
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="presenterLocalisedConfig.icon"
                :icon-dark="presenterLocalisedConfig.iconDark"
                :overline="activeConfigOptionConfig.label"
                :title="presenterLocalisedConfig.label"
                @clear="$emit('clear')"
                @close="$emit('close')"
            >
                <!-- Tags -->
                <div class="mt-3 mb-6 flex flex-wrap gap-1.5">
                    <Tag :text="`v${presenterLocalisedConfig.version}`" />
                    <Tag v-if="presenterStatus" :text="presenterLocalisedConfig.statusId ?? ''" :color="presenterStatus.color" />
                </div>

                <!-- Description -->
                <p>{{ presenterLocalisedConfig.description }}</p>

                <!-- Links -->
                <ModuleLinksPanel :localised-config="presenterLocalisedConfig" />
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
