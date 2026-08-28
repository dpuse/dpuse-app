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
import type { ConfigOptionConfig, ManagedModuleConfig } from '@/utilities/index.ts';

// ── Static Components
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StudioDetailPanel from '@/studio/components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/studio/components/StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Named here rather than passed in by each panel so the region can never drift from the module it labels.
const DATA_REGIONS: Partial<Record<ModuleTypeId, string>> = {
    connector: 'ConfigConnectorPanel',
    cookbook: 'ConfigCookbookPanel',
    presenter: 'ConfigPresenterPanel',
    tool: 'ConfigToolPanel'
};

const T = {
    Documentation: { en: 'Documentation', es: 'Documentación' },
    GitHub_repository: { en: 'GitHub Repository', es: 'Repositorio de GitHub' },
    Links: { en: 'Links', es: 'Enlaces' },
    Sign_in: { en: 'Sign in', es: 'Iniciar sesión' },
    Website: { en: 'Website', es: 'Sitio web' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    activeConfigOptionConfig: LocalisedConfig<ConfigOptionConfig>;
    localisedConfig: LocalisedConfig<ManagedModuleConfig>;
}
const { activeConfigOptionConfig, localisedConfig } = defineProps<Properties>();

defineEmits<{ clear: []; close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const moduleStatus = computed(() => (localisedConfig.statusId ? getComponentStatus(localisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel :data-region="DATA_REGIONS[localisedConfig.typeId]">
        <ScrollArea scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="localisedConfig.icon"
                :icon-dark="localisedConfig.iconDark"
                :overline="activeConfigOptionConfig.label"
                :title="localisedConfig.label"
                @clear="$emit('clear')"
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
                <h2>{{ t(T, 'Links') }}</h2>
                <ul>
                    <li v-if="localisedConfig.vendorHomeURL" class="flex items-center gap-x-2">
                        <GlobeIcon class="size-4" />
                        <a :href="localisedConfig.vendorHomeURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ localisedConfig.label }}
                            {{ t(T, 'Website') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="localisedConfig.vendorDocumentationURL" class="flex items-center gap-x-2">
                        <InfoIcon class="size-4" />
                        <a :href="localisedConfig.vendorDocumentationURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ localisedConfig.label }}
                            {{ t(T, 'Documentation') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="localisedConfig.vendorAccountURL" class="flex items-center gap-x-2">
                        <UserRoundIcon class="size-4" />
                        <a :href="localisedConfig.vendorAccountURL" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            {{ localisedConfig.label }}
                            {{ t(T, 'Sign_in') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li class="flex items-center gap-x-2">
                        <a :href="`https://github.com/dpuse/${localisedConfig.id}`" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
                            <GitHubLogo class="size-4" />
                            {{ t(T, 'GitHub_repository') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>
                </ul>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailPanel>
</template>
