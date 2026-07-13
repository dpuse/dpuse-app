<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ExternalLinkIcon, GlobeIcon, InfoIcon, UserRoundIcon } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectorConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { constructConnectorCategoryConfig } from '@dpuse/dpuse-shared/component/module/connector';
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local (App) Framework
import T from './ConnectorForm.json';
import { t } from '@/state/locale';

// ── Local Components - Static
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { connectorLocalisedConfig } = defineProps<{ connectorLocalisedConfig: LocalisedConfig<ConnectorConfig> }>();
const emit = defineEmits<{ submit: [] }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const AUTH_METHOD_DESCRIPTIONS: Record<string, string> = {
    apiKey: 'API Key',
    oAuth2: "Requires OAuth 2.0 authentication for each account connected; access is scoped to that account's files and folders only.",
    none: 'Does not require authentication and can be used without creating a DPUse Account. Only a single connection is supported.'
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

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    emit('submit');
    await router.push({ name: 'selectItem', query: { ...route.query, wbView: 'selectItem' } });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function getCategoryConnectorLabel(categoryId: string): string {
    return `${constructConnectorCategoryConfig(categoryId).label} Connector`;
}
</script>

<template>
    <form class="flex min-h-0 flex-1 flex-col pl-4" data-region="ConnectorForm" @submit.prevent="handleSubmit">
        <ScrollArea scroll-area-padding="screen">
            <div class="dpuse-text flex flex-col gap-y-4 pt-4">
                <!-- Header -->
                <div class="flex items-center">
                    <div class="flex-1">
                        <!-- Overline -->
                        <div class="dpuse-text-overline">{{ getCategoryConnectorLabel(connectorLocalisedConfig.categoryId) }}</div>

                        <!-- Title -->
                        <div class="flex items-center gap-x-1.5">
                            <h1>{{ connectorLocalisedConfig.label }}</h1>
                        </div>

                        <!-- Tags -->
                        <div class="mt-4 flex flex-wrap gap-1.5">
                            <Tag :text="`v${connectorLocalisedConfig.version}`" />
                            <Tag
                                v-if="connectorLocalisedConfig.status"
                                :text="connectorLocalisedConfig.status.label"
                                :color="connectorLocalisedConfig.status.color === 'other' ? undefined : connectorLocalisedConfig.status.color"
                            />
                            <Tag
                                v-else-if="connectorLocalisedConfig.statusId"
                                :text="connectorLocalisedConfig.statusId"
                                :color="
                                    getComponentStatus(connectorLocalisedConfig.statusId).color === 'other'
                                        ? undefined
                                        : getComponentStatus(connectorLocalisedConfig.statusId).color
                                "
                            />
                        </div>
                    </div>

                    <!-- Logo -->
                    <div v-if="connectorLocalisedConfig.icon != null" class="mr-2 flex-none">
                        <div aria-hidden="true" class="flex h-12 items-center dark:hidden [&>svg]:h-full [&>svg]:w-auto" v-html="connectorLocalisedConfig.icon" />
                        <div
                            aria-hidden="true"
                            class="hidden h-12 items-center dark:flex [&>svg]:h-full [&>svg]:w-auto"
                            v-html="connectorLocalisedConfig.iconDark ?? connectorLocalisedConfig.icon ?? ''"
                        />
                    </div>
                </div>

                <!-- Description -->
                <p v-for="paragraph in connectorLocalisedConfig.description" :key="paragraph">{{ paragraph }}</p>

                <!-- Authentication -->
                <div class="flex flex-col gap-y-2">
                    <h2>{{ t(T, 'Authentication') }}</h2>
                    <p v-for="method in authMethods" :key="method">
                        {{ AUTH_METHOD_DESCRIPTIONS[method] ?? method }}
                    </p>
                </div>

                <!-- Links -->
                <div class="flex flex-col gap-y-2">
                    <h2>{{ t(T, 'Links') }}</h2>

                    <a
                        v-if="connectorLocalisedConfig.vendorHomeURL"
                        :href="connectorLocalisedConfig.vendorHomeURL"
                        class="inline-flex items-center gap-x-1 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <GlobeIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Website
                        <ExternalLinkIcon class="size-4" />
                    </a>

                    <a
                        v-if="connectorLocalisedConfig.vendorDocumentationURL"
                        :href="connectorLocalisedConfig.vendorDocumentationURL"
                        class="inline-flex items-center gap-x-1 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <InfoIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Documentation
                        <ExternalLinkIcon class="size-4" />
                    </a>

                    <a
                        v-if="connectorLocalisedConfig.vendorAccountURL"
                        :href="connectorLocalisedConfig.vendorAccountURL"
                        class="inline-flex items-center gap-x-1 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <UserRoundIcon class="size-4" /> {{ connectorLocalisedConfig.label }} Sign in
                        <ExternalLinkIcon class="size-4" />
                    </a>

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
                </div>
            </div>
        </ScrollArea>
    </form>
</template>
