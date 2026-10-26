<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ExternalLinkIcon } from '@lucide/vue';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared';
import type { LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './PluginPanel_.json';
import { localeId, t } from '@/state/locale';
import type { PluginConfig, SetupOptionConfig } from '@/features/studio/setup/useSetupOptions';

// ── Static Components
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StudioDetailLayout from '@/features/studio/_components/StudioDetailLayout.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface VendorLink {
    getURL: (config: LocalisedConfig<PluginConfig>) => string | null | undefined; // Undefined when a plugin's config leaves the field out.
    id: string;
    labelKey: keyof typeof TEXT;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The GitHub link is kept out of this list: it always shows, and builds its URL from the plugin id.
const VENDOR_LINKS: VendorLink[] = [
    { getURL: (config) => config.vendorHomeURL, id: 'website', labelKey: 'website.label' },
    { getURL: (config) => config.vendorDocumentationURL, id: 'documentation', labelKey: 'documentation.label' },
    { getURL: (config) => config.vendorAccountURL, id: 'signIn', labelKey: 'signIn.label' }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isHideable, pluginLocalisedConfig, setupOptionLocalisedConfig } = defineProps<{
    isHideable?: boolean; // Offers a Hide section last, for plugins the user can take out of the app's lists.
    pluginLocalisedConfig: LocalisedConfig<PluginConfig>;
    setupOptionLocalisedConfig: LocalisedConfig<SetupOptionConfig>;
}>();

defineSlots<{
    default?(): unknown; // Rendered between the details and the links.
    details?(): unknown; // Rows added to the details list after the version, as 'dt' and 'dd' pairs.
}>();

defineEmits<{ close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const pluginStatus = computed(() => (pluginLocalisedConfig.statusId ? getComponentStatus(pluginLocalisedConfig.statusId, localeId.value) : undefined));
const vendorLinks = computed(() =>
    VENDOR_LINKS.flatMap((vendorLink) => {
        const url = vendorLink.getURL(pluginLocalisedConfig);
        return url == null || url === '' ? [] : { ...vendorLink, url, urlText: constructURLText(url) };
    })
);
const gitHubURL = computed(() => `https://github.com/dpuse/${pluginLocalisedConfig.id}`);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleHide(): void {
    // TODO: Hide the plugin, once plugins can be hidden.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function formatDate(timestamp: number): string {
    return new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium' }).format(timestamp);
}

// A link shows where it goes, without the protocol, because the row's label already says what it is.
function constructURLText(url: string): string {
    try {
        const { host, pathname } = new URL(url);
        return pathname === '/' ? host : `${host}${pathname}`;
    } catch {
        return url; // Not a full URL, so it is shown as given.
    }
}
</script>

<template>
    <StudioDetailLayout data-region="PluginPanel">
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)" scroll-area-padding-left="var(--spacing-page)">
            <StudioDocumentPanel
                :icon="pluginLocalisedConfig.icon"
                :icon-dark="pluginLocalisedConfig.iconDark"
                :overline="setupOptionLocalisedConfig.label"
                :title="pluginLocalisedConfig.label"
                @close="$emit('close')"
            >
                <!-- Description -->
                <p>{{ pluginLocalisedConfig.description }}</p>

                <!-- Details ─ Laid out as the data view document's lists: a label column at least 7.5rem wide that widens
                     to fit its longest label, so a label never runs into its value, and a line under every row except the
                     last when nothing follows it, because the next section's heading draws its own.
                     Status keeps its tag, because it is a caution. General availability has no label, so shows no tag. -->
                <dl
                    class="mt-4 grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4"
                >
                    <dt class="text-muted">{{ t(TEXT, 'version.label') }}</dt>
                    <dd class="m-0 flex min-w-0 flex-wrap items-center gap-x-2">
                        <span>{{ t(TEXT, 'version.text', { version: pluginLocalisedConfig.version }) }}</span>
                        <Tag v-if="pluginStatus?.label" :color="pluginStatus.color" :text="pluginStatus.label" />
                    </dd>
                    <template v-if="pluginLocalisedConfig.firstCreatedAt != null">
                        <dt class="text-muted">{{ t(TEXT, 'created.label') }}</dt>
                        <dd class="m-0">{{ formatDate(pluginLocalisedConfig.firstCreatedAt) }}</dd>
                    </template>
                    <template v-if="pluginLocalisedConfig.lastUpdatedAt != null">
                        <dt class="text-muted">{{ t(TEXT, 'lastUpdated.label') }}</dt>
                        <dd class="m-0">{{ formatDate(pluginLocalisedConfig.lastUpdatedAt) }}</dd>
                    </template>
                    <slot name="details" />
                </dl>

                <!-- Content -->
                <slot />

                <!-- Links ─ The GitHub repository always shows, because every plugin has one. A long address is cut off with an
                     ellipsis rather than widening the document. -->
                <StudioDocumentSection :title="t(TEXT, 'links.title')">
                    <dl
                        class="grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4"
                    >
                        <template v-for="vendorLink in vendorLinks" :key="vendorLink.id">
                            <dt class="text-muted">{{ t(TEXT, vendorLink.labelKey) }}</dt>
                            <dd class="m-0 min-w-0">
                                <a :href="vendorLink.url" class="inline-flex max-w-full items-center gap-x-1" rel="noopener noreferrer" target="_blank">
                                    <span class="min-w-0 truncate">{{ vendorLink.urlText }}</span>
                                    <ExternalLinkIcon aria-hidden="true" class="size-3.5 flex-none" />
                                </a>
                            </dd>
                        </template>
                        <dt class="text-muted">{{ t(TEXT, 'gitHubRepository.label') }}</dt>
                        <dd class="m-0 min-w-0">
                            <a :href="gitHubURL" class="inline-flex max-w-full items-center gap-x-1" rel="noopener noreferrer" target="_blank">
                                <span class="min-w-0 truncate">{{ constructURLText(gitHubURL) }}</span>
                                <ExternalLinkIcon aria-hidden="true" class="size-3.5 flex-none" />
                            </a>
                        </dd>
                    </dl>
                </StudioDocumentSection>

                <!-- Hide ─ Last, as Delete and Hide are in every document, and in the warning colour, because a hidden
                     plugin can be shown again. -->
                <StudioDocumentSection v-if="isHideable" :title="t(TEXT, 'hide.title')">
                    <p>{{ t(TEXT, 'hide.text') }}</p>
                    <RectangleButton variant="guarded" @click="handleHide">{{ t(TEXT, 'hide.label', { label: pluginLocalisedConfig.label }) }}</RectangleButton>
                </StudioDocumentSection>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailLayout>
</template>
