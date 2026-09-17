<script setup lang="ts">
// ── External Dependencies & Registrations
import { type Component, computed } from 'vue';
import { ExternalLinkIcon, GlobeIcon, InfoIcon, UserRoundIcon } from '@lucide/vue';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { T } from './PluginPanel_.json';
import { localeId, t } from '@/state/locale';
import type { PluginConfig, SetupOptionConfig } from '@/utilities/index.ts';

// ── Static Components
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StudioDetailPanel from '@/features/studio/_components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface VendorLink {
    getURL: (config: LocalisedConfig<PluginConfig>) => string | null;
    icon: Component;
    id: string;
    labelKey: keyof typeof T;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The GitHub link is kept out of this list: it always shows, builds its URL from the plugin id, and places its logo
// inside the link.
const VENDOR_LINKS: VendorLink[] = [
    { getURL: (config) => config.vendorHomeURL, icon: GlobeIcon, id: 'website', labelKey: 'website.label' },
    { getURL: (config) => config.vendorDocumentationURL, icon: InfoIcon, id: 'documentation', labelKey: 'documentation.label' },
    { getURL: (config) => config.vendorAccountURL, icon: UserRoundIcon, id: 'signIn', labelKey: 'signIn.label' }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { pluginLocalisedConfig, setupOptionLocalisedConfig } = defineProps<{
    pluginLocalisedConfig: LocalisedConfig<PluginConfig>;
    setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig>;
}>();

defineSlots<{
    default?(): unknown; // Rendered between the description and the links.
    tags?(): unknown; // Rendered before the version and status tags.
}>();

defineEmits<{ close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const pluginStatus = computed(() => (pluginLocalisedConfig.statusId ? getComponentStatus(pluginLocalisedConfig.statusId, localeId.value) : undefined));
const vendorLinks = computed(() =>
    VENDOR_LINKS.flatMap((vendorLink) => {
        const url = vendorLink.getURL(pluginLocalisedConfig);
        return url === null || url === '' ? [] : [{ ...vendorLink, url }];
    })
);
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
                    <!-- General availability has no label, so shows no tag. -->
                    <Tag v-if="pluginStatus?.label" :text="pluginStatus.label" :color="pluginStatus.color" />
                </div>

                <!-- Description -->
                <p>{{ pluginLocalisedConfig.description }}</p>

                <!-- Content -->
                <slot />

                <!-- Links -->
                <h2>{{ t(T, 'links.title') }}</h2>
                <ul>
                    <li v-for="vendorLink in vendorLinks" :key="vendorLink.id" class="flex items-center gap-x-2">
                        <component :is="vendorLink.icon" class="size-4" />
                        <a :href="vendorLink.url" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ t(T, vendorLink.labelKey, { label: pluginLocalisedConfig.label }) }}
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
