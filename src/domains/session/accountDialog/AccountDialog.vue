<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { ArrowBigLeftIcon, LoaderCircleIcon } from 'lucide-vue-next';
import { type Component, defineAsyncComponent, onErrorCaptured, ref, shallowRef, watch } from 'vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './AccountDialog.json';
import { viewportIsWide } from '@/state/appLayout';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ChunkLoadError from '@/components/ui/ChunkLoadError.vue';
import ListItemButton from '@/components/ui/button/ListItemButton.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

type OptionLocalisedConfig = { id: string; type?: 'label'; icon?: string; label: string; title?: string; isDestructive?: boolean };
const OPTION_CONFIGS: OptionLocalisedConfig[] = [
    { id: 'profile', type: 'label', label: 'Profile' },
    { id: 'managePersonalDetails', icon: '', label: 'Personal details', title: 'Manage Personal Details' },
    { id: 'manageSubscription', icon: '', label: 'Subscription & billing' },
    { id: 'managePreferences', icon: '', label: 'Preferences' },
    { id: 'security', type: 'label', label: 'Security' },
    { id: 'manageAccess', icon: '', label: 'Access' },
    { id: 'manageSessions', icon: '', label: 'Active sessions' },
    { id: 'reviewActivity', icon: '', label: 'Recent activity' },
    { id: 'integrations', type: 'label', label: 'Integrations' },
    { id: 'manageDataServiceTokens', icon: '', label: 'Data service tokens' },
    { id: 'development', type: 'label', label: 'Development' },
    { id: 'generateToken', icon: '', label: 'API token' },
    { id: 'criticalActions', type: 'label', label: 'Critical Actions' },
    { id: 'deleteAccount', icon: '', label: 'Delete account', isDestructive: true }
];
const OPTION_COMPONENT_MAP: Record<string, Component> = {
    managePersonalDetails: defineAsyncComponent(() => import('./ManagePersonalDetailsPanel.vue')),
    manageSubscription: defineAsyncComponent(() => import('./ManageSubscriptionPanel.vue')),
    managePreferences: defineAsyncComponent(() => import('./ManagePreferencesPanel.vue')),
    manageAccess: defineAsyncComponent(() => import('./ManageAccessPanel.vue')),
    manageSessions: defineAsyncComponent(() => import('./ManageSessionsPanel.vue')),
    reviewActivity: defineAsyncComponent(() => import('./ReviewActivityPanel.vue')),
    manageDataServiceTokens: defineAsyncComponent(() => import('./ManageDataServiceTokensPanel.vue')),
    generateToken: defineAsyncComponent(() => import('./GenerateTokenPanel.vue')),
    deleteAccount: defineAsyncComponent(() => import('./DeleteAccountPanel.vue'))
};

// Options, Properties, Slots, ModelValue & Emits ──────────────────────────────────────────────────────────────────────

const { close } = defineProps<{ close: () => void }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

const activeOptionConfig = shallowRef<OptionLocalisedConfig | undefined>(initialiseActiveOptionConfig()); // TODO: Use route to set this!
const subPanelError = ref<unknown>(null);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onErrorCaptured((error) => {
    subPanelError.value = error;
    return false;
});

watch(viewportIsWide, (isWide) => {
    if (isWide && !activeOptionConfig.value) activeOptionConfig.value = OPTION_CONFIGS[1];
});

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleBack(): void {
    activeOptionConfig.value = undefined;
}

function initialiseActiveOptionConfig(): OptionLocalisedConfig | undefined {
    const routeName = route.name;
    if (routeName === 'account') {
        if (viewportIsWide.value) {
            return OPTION_CONFIGS[1];
        }
    } else {
        const activeOptionConfig = OPTION_CONFIGS.find((config) => config.id === route.name);
        if (!activeOptionConfig) {
            if (viewportIsWide.value) {
                return OPTION_CONFIGS[1];
            }
            return;
        }
        return activeOptionConfig;
    }
}
</script>

<template>
    <!-- <div class="fixed inset-0 z-50">
        <div
            role="dialog"
            aria-modal="true"
            class="bg-surface text-content z-10 flex h-full max-h-full w-full max-w-full flex-col sm:absolute sm:top-[5%] sm:left-1/2 sm:h-auto sm:max-h-[90vh] sm:w-3xl sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:rounded-lg"
            tabindex="-1"
        > -->
    <div class="border-separator mx-4 flex flex-none justify-start border-b py-4 text-lg font-light">{{ t(T, 'Manage_Account') }}</div>

    <div class="flex flex-1 overflow-y-hidden">
        <div v-if="viewportIsWide || !activeOptionConfig" class="flex flex-1 flex-col gap-y-1 overflow-y-auto overscroll-y-none px-4 pb-6">
            <div class="flex flex-1 flex-col gap-y-1">
                <template v-for="optionConfig in OPTION_CONFIGS" :key="optionConfig.id">
                    <div v-if="optionConfig.type === 'label'" class="text-muted mt-3 text-xs font-medium">{{ optionConfig.label }}</div>
                    <ListItemButton
                        v-else
                        class="inline-flex min-w-50 justify-start"
                        :is-active="route.name === optionConfig.id && viewportIsWide"
                        :variant="optionConfig.isDestructive ? 'destructive' : 'neutral'"
                        @click="activeOptionConfig = optionConfig"
                    >
                        {{ optionConfig.label }}
                    </ListItemButton>
                </template>
            </div>

            <!-- <div class="text-muted mt-2 text-xs font-medium">{{ t(T, 'Critical_Actions') }}</div> -->

            <!-- <Button class="min-w-50 justify-start" :to="{ name: 'deleteAccount', query: route.query }" variant="destructive">
                        {{ t(T, 'Delete_account') }}
                    </Button> -->
        </div>

        <div v-if="viewportIsWide || activeOptionConfig" class="flex flex-1 flex-col px-4">
            <div class="border-separator flex h-12 flex-none items-center gap-x-1 border-b">
                <Button v-if="!viewportIsWide" shape="icon" size="sm" @click="handleBack">
                    <ArrowBigLeftIcon stroke-width="1.25" />
                </Button>
                {{ activeOptionConfig!.title }}
            </div>

            <ChunkLoadError v-if="subPanelError" :error="subPanelError" chunk-name="account panel" class="flex-1" />
            <Suspense v-else>
                <template #default>
                    <component :is="OPTION_COMPONENT_MAP[activeOptionConfig?.id ?? '']" class="flex-1" />
                </template>
                <template #fallback>
                    <div class="flex flex-1 items-center justify-center">
                        <LoaderCircleIcon class="text-muted animate-spin" />
                    </div>
                </template>
            </Suspense>
        </div>
    </div>
</template>
