<script setup lang="ts">
// ── External Dependencies & Registrations
import { ExternalLinkIcon, GlobeIcon, InfoIcon, UserRoundIcon } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import type { ToolConfig } from '@dpuse/dpuse-shared/component/module/tool';

// ── Local Framework
import T from './ToolForm.json';
import { t } from '@/state/locale';

// ── Local Components - Static
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { toolLocalisedConfig } = defineProps<{ toolLocalisedConfig: LocalisedConfig<ToolConfig> }>();
const emit = defineEmits<{ submit: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    emit('submit');
    await router.push({ name: 'selectItem', query: { ...route.query, sView: 'selectItem' } });
}
</script>

<template>
    <form class="flex min-h-0 flex-1 flex-col pl-4" data-region="ConnectorForm" @submit.prevent="handleSubmit">
        <ScrollArea scroll-area-padding="screen">
            <div class="dpuse-prose pt-4">
                <!-- Header -->
                <div class="flex items-center gap-x-4">
                    <div class="flex-1">
                        <!-- Overline -->
                        <div class="dpuse-prose-overline">Tool</div>

                        <!-- Title -->
                        <div class="flex items-center gap-x-1.5">
                            <h1>{{ toolLocalisedConfig.label }}</h1>
                        </div>

                        <!-- Tags -->
                        <div class="mt-4 flex flex-wrap gap-1.5">
                            <Tag :text="`v${toolLocalisedConfig.version}`" />
                            <Tag
                                v-if="toolLocalisedConfig.status"
                                :text="toolLocalisedConfig.status.label"
                                :color="toolLocalisedConfig.status.color === 'other' ? undefined : toolLocalisedConfig.status.color"
                            />
                            <Tag
                                v-else-if="toolLocalisedConfig.statusId"
                                :text="toolLocalisedConfig.statusId"
                                :color="getComponentStatus(toolLocalisedConfig.statusId).color === 'other' ? undefined : getComponentStatus(toolLocalisedConfig.statusId).color"
                            />
                        </div>
                    </div>

                    <!-- Logo -->
                    <div v-if="toolLocalisedConfig.icon != null" class="mr-2 flex-none">
                        <div aria-hidden="true" class="flex h-12 items-center dark:hidden [&>svg]:h-full [&>svg]:w-auto" v-html="toolLocalisedConfig.icon" />
                        <div
                            aria-hidden="true"
                            class="hidden h-12 items-center dark:flex [&>svg]:h-full [&>svg]:w-auto"
                            v-html="toolLocalisedConfig.iconDark ?? toolLocalisedConfig.icon ?? ''"
                        />
                    </div>
                </div>

                <!-- Description -->
                <p>{{ toolLocalisedConfig.description }}</p>

                <!-- Links -->
                <h2>{{ t(T, 'Links') }}</h2>

                <ul>
                    <!-- <li v-if="connectorLocalisedConfig.vendorHomeURL">
                        <a :href="connectorLocalisedConfig.vendorHomeURL" class="inline-flex items-center gap-x-1 hover:underline" target="_blank" rel="noopener noreferrer">
                            <GlobeIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Website
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li> -->

                    <!-- <li v-if="connectorLocalisedConfig.vendorDocumentationURL">
                        <a
                            :href="connectorLocalisedConfig.vendorDocumentationURL"
                            class="inline-flex items-center gap-x-1 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <InfoIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Documentation
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li> -->

                    <!-- <li v-if="connectorLocalisedConfig.vendorAccountURL">
                        <a :href="connectorLocalisedConfig.vendorAccountURL" class="inline-flex items-center gap-x-1 hover:underline" target="_blank" rel="noopener noreferrer">
                            <UserRoundIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Sign in
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li> -->

                    <li>
                        <a
                            :href="`https://github.com/dpuse/${toolLocalisedConfig.id}`"
                            class="inline-flex items-center gap-x-1 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <GitHubLogo class="size-4" />
                            {{ t(T, 'GitHub_repository') }}
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>
                </ul>
            </div>
        </ScrollArea>
    </form>
</template>

<style scoped>
ul {
    list-style: none;
    padding-left: 0;
}
</style>
