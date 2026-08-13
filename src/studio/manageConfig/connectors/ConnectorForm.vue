<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ArrowLeftIcon, ExternalLinkIcon, GlobeIcon, InfoIcon, UserRoundIcon } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { constructConnectorCategoryConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import T from './ConnectorForm.json';
import { t } from '@/state/locale';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import ScrollArea from '@/components/ui/ScrollArea2.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { connectorLocalisedConfig } = defineProps<{ connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> }>();
const emit = defineEmits<{ clear: []; submit: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const AUTH_METHOD_DESCRIPTIONS: Record<string, string> = {
    apiKey: 'API Key',
    oAuth2: "Requires OAuth 2.0 authentication for each account connected; access is scoped to that account's files and folders only.",
    none: 'Does not require authentication and can be used without creating a DPUse Account. Only a single connection is supported.'
};

const CONNECTOR_USAGE_DESCRIPTIONS: Record<string, string> = {
    bidirectional: 'This connector supports both sourcing and delivering data.',
    destination: 'This connector is used exclusively for delivering data.',
    source: 'This connector is used exclusively for sourcing data.',
    unknown: 'The usage for this connector has not yet been determined.'
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const authMethods = computed(() => [
    ...new Set(
        Object.values(connectorLocalisedConfig.implementations)
            .map((impl) => impl.authMethodId)
            .filter((id) => id !== 'disabled')
    )
]);

const connectorStatus = computed(() => (connectorLocalisedConfig.statusId ? getComponentStatus(connectorLocalisedConfig.statusId) : undefined));

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
                <div class="flex items-start gap-x-4">
                    <div class="flex min-w-0 flex-1 flex-col">
                        <Button class="group block w-full min-w-0 cursor-pointer text-left" shape="minimal" @click="$emit('clear')">
                            <!-- Overline -->
                            <div class="flex min-w-0 items-center gap-x-0.5 leading-tight group-hover:text-blue-500">
                                <ArrowLeftIcon class="size-5 flex-none" />
                                <span class="min-w-0 truncate">Connectors</span>
                                <span class="size-5 flex-none" />
                            </div>

                            <!-- Title -->
                            <h1 class="min-w-0 text-left wrap-break-word whitespace-normal">{{ connectorLocalisedConfig.label }}</h1>
                        </Button>

                        <!-- Tags -->
                        <div class="mt-2 flex flex-wrap gap-1.5">
                            <Tag :text="connectorLocalisedConfig.categoryId" />
                            <Tag :text="`v${connectorLocalisedConfig.version}`" />
                            <Tag v-if="connectorStatus" :text="connectorLocalisedConfig.statusId ?? ''" :color="connectorStatus.color" />
                        </div>
                    </div>

                    <!-- Logo -->
                    <div class="flex max-w-1/4 flex-none flex-col items-end gap-y-2">
                        <Button shape="minimal">
                            <div class="flex items-center gap-x-1 text-subtle">
                                <InfoIcon class="size-5" />
                                About
                            </div>
                        </Button>
                        <div v-if="connectorLocalisedConfig.icon != null">
                            <div aria-hidden="true" class="flex h-12 items-center dark:hidden [&>svg]:h-full [&>svg]:w-auto" v-html="connectorLocalisedConfig.icon" />
                            <div
                                aria-hidden="true"
                                class="hidden h-12 items-center dark:flex [&>svg]:h-full [&>svg]:w-auto"
                                v-html="connectorLocalisedConfig.iconDark ?? connectorLocalisedConfig.icon ?? ''"
                            />
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <p>{{ connectorLocalisedConfig.description }}</p>

                <p>{{ CONNECTOR_USAGE_DESCRIPTIONS[connectorLocalisedConfig.usageId ?? 'unknown'] }}</p>

                <!-- Authentication -->
                <h2>{{ t(T, 'Authentication') }}</h2>
                <p v-for="method in authMethods" :key="method">
                    {{ AUTH_METHOD_DESCRIPTIONS[method] ?? method }}
                </p>

                <!-- Links -->
                <h2>{{ t(T, 'Links') }}</h2>

                <ul>
                    <li v-if="connectorLocalisedConfig.vendorHomeURL">
                        <a :href="connectorLocalisedConfig.vendorHomeURL" class="inline-flex items-center gap-x-1 hover:underline" target="_blank" rel="noopener noreferrer">
                            <GlobeIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Website
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="connectorLocalisedConfig.vendorDocumentationURL">
                        <a
                            :href="connectorLocalisedConfig.vendorDocumentationURL"
                            class="inline-flex items-center gap-x-1 hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <InfoIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Documentation
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li v-if="connectorLocalisedConfig.vendorAccountURL">
                        <a :href="connectorLocalisedConfig.vendorAccountURL" class="inline-flex items-center gap-x-1 hover:underline" target="_blank" rel="noopener noreferrer">
                            <UserRoundIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Sign in
                            <ExternalLinkIcon class="size-4" />
                        </a>
                    </li>

                    <li>
                        <a
                            :href="`https://github.com/dpuse/${connectorLocalisedConfig.id}`"
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
