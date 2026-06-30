<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ExternalLinkIcon } from 'lucide-vue-next';
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

const links = computed(() => {
    const result: { label: string; url: string }[] = [];
    if (connectorLocalisedConfig.vendorHomeURL != null) result.push({ label: t(T, 'Vendor_website'), url: connectorLocalisedConfig.vendorHomeURL });
    if (connectorLocalisedConfig.vendorDocumentationURL != null) result.push({ label: t(T, 'Vendor_documentation'), url: connectorLocalisedConfig.vendorDocumentationURL });
    if (connectorLocalisedConfig.vendorAccountURL != null) result.push({ label: t(T, 'Manage_account'), url: connectorLocalisedConfig.vendorAccountURL });
    return result;
});

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
                <div>
                    <div class="text-sm leading-tight text-muted">{{ getCategoryConnectorLabel(connectorLocalisedConfig.categoryId) }}</div>
                    <div class="flex items-center gap-x-1.5">
                        <div v-if="connectorLocalisedConfig.icon != null || connectorLocalisedConfig.iconDark != null">
                            <div
                                v-if="connectorLocalisedConfig.icon != null"
                                aria-hidden="true"
                                class="flex size-8 items-center dark:hidden"
                                v-html="connectorLocalisedConfig.icon"
                            />
                            <div
                                aria-hidden="true"
                                class="hidden size-8 items-center dark:flex"
                                v-html="connectorLocalisedConfig.iconDark ?? connectorLocalisedConfig.icon ?? ''"
                            />
                        </div>
                        <h1>{{ connectorLocalisedConfig.label }}</h1>
                    </div>
                </div>

                <!-- Tags -->
                <div class="flex flex-wrap gap-1.5">
                    <Tag :text="`v${connectorLocalisedConfig.version}`" />
                    <Tag
                        v-if="connectorLocalisedConfig.status"
                        :text="connectorLocalisedConfig.status.label"
                        :color="connectorLocalisedConfig.status.color === 'other' ? undefined : connectorLocalisedConfig.status.color"
                    />
                    <Tag
                        v-else-if="connectorLocalisedConfig.statusId"
                        :text="connectorLocalisedConfig.statusId"
                        :color="getComponentStatus(connectorLocalisedConfig.statusId).color === 'other' ? undefined : getComponentStatus(connectorLocalisedConfig.statusId).color"
                    />
                </div>

                <!-- Description -->
                <p v-for="paragraph in connectorLocalisedConfig.description" :key="paragraph">{{ paragraph }}</p>

                <!-- Authentication -->
                <div class="flex flex-col gap-y-2">
                    <h3>{{ t(T, 'Authentication') }}</h3>
                    <ul class="flex list-disc flex-col gap-y-1 pl-5">
                        <li v-for="method in authMethods" :key="method">
                            {{ AUTH_METHOD_DESCRIPTIONS[method] ?? method }}
                        </li>
                    </ul>
                </div>

                <!-- Links -->
                <div v-if="links.length > 0" class="flex flex-col gap-y-2">
                    <h3>{{ t(T, 'Links') }}</h3>
                    <ul class="flex list-disc flex-col gap-y-1 pl-5">
                        <li v-for="link in links" :key="link.url">
                            <a :href="link.url" class="inline-flex items-center gap-x-1 hover:underline" target="_blank" rel="noopener noreferrer">
                                {{ link.label }}
                                <ExternalLinkIcon class="size-3" />
                            </a>
                        </li>
                    </ul>
                </div>

                <!-- Technical -->
                <div class="flex flex-col gap-y-2">
                    <h3>{{ t(T, 'Technical') }}</h3>

                    <ul class="list-disc pl-5">
                        <li><strong>Connector ID</strong>: {{ connectorLocalisedConfig.id }}'.</li>
                    </ul>
                </div>
                <!-- Technical -->
                <div class="flex flex-col gap-y-2">
                    <h3>Source</h3>
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
