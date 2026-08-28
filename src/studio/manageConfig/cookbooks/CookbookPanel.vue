<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import type { CookbookConfig } from '@dpuse/dpuse-shared/component/module/cookbook';
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

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
    cookbookLocalisedConfig: LocalisedConfig<CookbookConfig>;
}
const { cookbookLocalisedConfig } = defineProps<Properties>();

defineEmits<{ clear: []; close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const cookbookStatus = computed(() => (cookbookLocalisedConfig.statusId ? getComponentStatus(cookbookLocalisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel data-region="CookbookPanel">
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="cookbookLocalisedConfig.icon"
                :icon-dark="cookbookLocalisedConfig.iconDark"
                :overline="activeConfigOptionConfig.label"
                :title="cookbookLocalisedConfig.label"
                @clear="$emit('clear')"
                @close="$emit('close')"
            >
                <!-- Tags -->
                <div class="mt-3 mb-6 flex flex-wrap gap-1.5">
                    <Tag :text="`v${cookbookLocalisedConfig.version}`" />
                    <Tag v-if="cookbookStatus" :text="cookbookLocalisedConfig.statusId ?? ''" :color="cookbookStatus.color" />
                </div>

                <!-- Description -->
                <p>{{ cookbookLocalisedConfig.description }}</p>

                <!-- Links -->
                <ModuleLinksPanel :localised-config="cookbookLocalisedConfig" />
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
