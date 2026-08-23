<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';

// ── Local Components - Static
import ModuleLinksPanel from '../ModuleLinksPanel.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import StudioDetailPanel from '../../StudioDetailPanel.vue';
import StudioDocumentPanel from '../../StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { presenterLocalisedConfig } = defineProps<{
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    presenterLocalisedConfig: LocalisedConfig<PresenterConfig>;
}>();
defineEmits<{ close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const presenterStatus = computed(() => (presenterLocalisedConfig.statusId ? getComponentStatus(presenterLocalisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel data-region="ConnectorPanel">
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel :overline="'Presenters'" :title="presenterLocalisedConfig.label" @close="$emit('close')">
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
