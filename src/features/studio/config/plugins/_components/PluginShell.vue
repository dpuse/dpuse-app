<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ExternalLinkIcon, GlobeIcon, InfoIcon, UserRoundIcon } from '@lucide/vue';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ModuleTypeId } from '@dpuse/dpuse-shared/component/module';

// ── Local Framework
import { t } from '@/state/locale';
import type { ConfigOptionConfig, PluginConfig } from '@/utilities/index.ts';

// ── Static Components
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StudioDetailPanel from '@/features/studio/_components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Named here rather than passed in by each panel so the region can never drift from the module it labels.
const DATA_REGIONS: Partial<Record<ModuleTypeId, string>> = {
    connector: 'PluginConnectorPanel',
    cookbook: 'PluginCookbookPanel',
    presenter: 'PluginPresenterPanel',
    tool: 'PluginToolPanel'
};

const T = {
    'documentation.label': { en: 'Documentation', es: 'Documentación' },
    'gitHubRepository.label': { en: 'GitHub Repository', es: 'Repositorio de GitHub' },
    'links.title': { en: 'Links', es: 'Enlaces' },
    'signIn.label': { en: 'Sign in', es: 'Iniciar sesión' },
    'website.label': { en: 'Website', es: 'Sitio web' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    config: LocalisedConfig<ConfigOptionConfig>;
    localisedConfig: LocalisedConfig<PluginConfig>;
}
const { config, localisedConfig } = defineProps<Properties>();

defineEmits<{ close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const moduleStatus = computed(() => (localisedConfig.statusId ? getComponentStatus(localisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel :data-region="DATA_REGIONS[localisedConfig.typeId]">
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="localisedConfig.icon"
                :icon-dark="localisedConfig.iconDark"
                :overline="config.label"
                :title="localisedConfig.label"
                @close="$emit('close')"
            >
                <!-- Tags -->
                <div class="mt-3 mb-6 flex flex-wrap gap-1.5">
                    <slot name="tags" />
                    <Tag :text="`v${localisedConfig.version}`" />
                    <Tag v-if="moduleStatus" :text="localisedConfig.statusId ?? ''" :color="moduleStatus.color" />
                </div>

                <!-- Description -->
                <p>{{ localisedConfig.description }}</p>

                <!-- Content -->
                <slot />

                <!-- Links -->
                <h2>{{ t(T, 'links.title') }}</h2>
                <ul>
                    <li v-if="localisedConfig.vendorHomeURL" class="flex items-center gap-x-2">
                        <GlobeIcon class="size-4" />
                        <a :href="localisedConfig.vendorHomeURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ localisedConfig.label }}
                            {{ t(T, 'website.label') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="localisedConfig.vendorDocumentationURL" class="flex items-center gap-x-2">
                        <InfoIcon class="size-4" />
                        <a :href="localisedConfig.vendorDocumentationURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ localisedConfig.label }}
                            {{ t(T, 'documentation.label') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="localisedConfig.vendorAccountURL" class="flex items-center gap-x-2">
                        <UserRoundIcon class="size-4" />
                        <a :href="localisedConfig.vendorAccountURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ localisedConfig.label }}
                            {{ t(T, 'signIn.label') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li class="flex items-center gap-x-2">
                        <a :href="`https://github.com/dpuse/${localisedConfig.id}`" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
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
