<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ExternalLinkIcon, GlobeIcon, InfoIcon, UserRoundIcon } from '@lucide/vue';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { PresenterConfig } from '@dpuse/dpuse-shared/component/module/presenter';

// ── Local Framework
import { t } from '@/state/locale';

// ── Local Components - Static
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import StudioDetailPanel from '../../StudioDetailPanel.vue';
import StudioDocumentPanel from '../../StudioDocumentPanel.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Authentication: { en: 'Authentication', es: 'Autenticación' },
    Links: { en: 'Links', es: 'Enlaces' },
    GitHub_repository: { en: 'GitHub Repository', es: 'Repositorio de GitHub' }
};

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { presenterLocalisedConfig } = defineProps<{ presenterLocalisedConfig: LocalisedConfig<PresenterConfig> }>();
defineEmits<{ close: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const presenterStatus = computed(() => (presenterLocalisedConfig.statusId ? getComponentStatus(presenterLocalisedConfig.statusId) : undefined));
</script>

<template>
    <StudioDetailPanel data-region="ConnectorPanel">
        <ScrollArea scroll-area-padding="screen">
            <StudioDocumentPanel :overline="'Tools'" :title="presenterLocalisedConfig.label" @close="$emit('close')">
                <!-- Tags -->
                <div class="mt-3 mb-6 flex flex-wrap gap-1.5">
                    <Tag :text="`v${presenterLocalisedConfig.version}`" />
                    <Tag v-if="presenterStatus" :text="presenterLocalisedConfig.statusId ?? ''" :color="presenterStatus.color" />
                </div>

                <!-- Description -->
                <p>{{ presenterLocalisedConfig.description }}</p>

                <!-- Links -->
                <h2>{{ t(T, 'Links') }}</h2>
                <ul>
                    <li class="flex items-center gap-x-2">
                        <a :href="`https://github.com/dpuse/${presenterLocalisedConfig.id}`" class="inline-flex items-center gap-x-2" target="_blank" rel="noopener noreferrer">
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
