<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ExternalLinkIcon, GlobeIcon, InfoIcon, UserRoundIcon } from '@lucide/vue';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { T } from './PluginPanel_.json';
import { t } from '@/state/locale';
import type { PluginConfig, SetupOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StudioDetailPanel from '@/features/studio/_components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { pluginLocalisedConfig, setupOptionLocalisedConfig } = defineProps<{
    pluginLocalisedConfig: LocalisedConfig<PluginConfig>;
    setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig>;
}>();

defineEmits<{ close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const pluginStatus = computed(() => (pluginLocalisedConfig.statusId ? getComponentStatus(pluginLocalisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel data-region="PluginPanel">
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="pluginLocalisedConfig.icon"
                :icon-dark="pluginLocalisedConfig.iconDark"
                :overline="setupOptionLocalisedConfig.label"
                :title="pluginLocalisedConfig.label"
                @close="$emit('close')"
            >
                <!-- Tags -->
                <div class="mt-3 mb-6 flex flex-wrap gap-1.5">
                    <slot name="tags" />
                    <Tag :text="`v${pluginLocalisedConfig.version}`" />
                    <Tag v-if="pluginStatus" :text="pluginLocalisedConfig.statusId ?? ''" :color="pluginStatus.color" />
                </div>

                <!-- Description -->
                <p>{{ pluginLocalisedConfig.description }}</p>

                <!-- Content -->
                <slot />

                <!-- Links -->
                <h2>{{ t(T, 'links.title') }}</h2>
                <ul>
                    <li v-if="pluginLocalisedConfig.vendorHomeURL" class="flex items-center gap-x-2">
                        <GlobeIcon class="size-4" />
                        <a :href="pluginLocalisedConfig.vendorHomeURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ pluginLocalisedConfig.label }}
                            {{ t(T, 'website.label') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="pluginLocalisedConfig.vendorDocumentationURL" class="flex items-center gap-x-2">
                        <InfoIcon class="size-4" />
                        <a :href="pluginLocalisedConfig.vendorDocumentationURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ pluginLocalisedConfig.label }}
                            {{ t(T, 'documentation.label') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="pluginLocalisedConfig.vendorAccountURL" class="flex items-center gap-x-2">
                        <UserRoundIcon class="size-4" />
                        <a :href="pluginLocalisedConfig.vendorAccountURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ pluginLocalisedConfig.label }}
                            {{ t(T, 'signIn.label') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li class="flex items-center gap-x-2">
                        <a :href="`https://github.com/dpuse/${pluginLocalisedConfig.id}`" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            <GitHubLogo class="size-4" />
                            {{ t(T, 'gitHubRepository.label') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>
                </ul>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
