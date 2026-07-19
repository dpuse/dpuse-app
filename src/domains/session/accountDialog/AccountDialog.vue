<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { ArrowBigLeftIcon, LoaderCircleIcon } from '@lucide/vue';
import { type Component, defineAsyncComponent, onErrorCaptured, ref, shallowRef, watch } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import T from './AccountDialog.json';
import { viewportIsWide } from '@/state/appLayout';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ComponentLoadError from '@/components/ui/ComponentLoadError.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import DialogLayout from '@/components/ui/dialog/DialogLayout.vue';
import DialogModal from '@/components/ui/dialog/DialogModal.vue';
import ListItemButton from '@/components/ui/button/ListItemButton.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

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

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

const activeOptionConfig = shallowRef<OptionLocalisedConfig | undefined>(initialiseActiveOptionConfig()); // TODO: Use route to set this!
const subPanelError = ref<unknown>(null);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onErrorCaptured((error) => {
    subPanelError.value = error;
    return false;
});

watch(viewportIsWide, (isWide) => {
    if (isWide && !activeOptionConfig.value) activeOptionConfig.value = OPTION_CONFIGS[1];
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

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
    <DialogLayout data-region="AccountDialog">
        <DialogModal variant="large">
            <DialogHeader class="flex-none" :title="t(T, 'Manage_Account')" />

            <div class="flex min-h-0 flex-1">
                <div v-if="viewportIsWide || !activeOptionConfig" class="flex flex-1 flex-col gap-y-1 pl-4">
                    <ScrollArea scroll-area-padding="none">
                        <div class="flex flex-1 flex-col gap-y-1 pb-6">
                            <template v-for="optionConfig in OPTION_CONFIGS" :key="optionConfig.id">
                                <div v-if="optionConfig.type === 'label'" class="mt-3 text-xs font-medium text-muted">{{ optionConfig.label }}</div>
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
                    </ScrollArea>
                </div>

                <div v-if="viewportIsWide || activeOptionConfig" class="flex flex-1 flex-col px-4">
                    <div class="flex h-12 flex-none items-center gap-x-1 border-b border-separator">
                        <Button v-if="!viewportIsWide" shape="icon" size="sm" @click="handleBack">
                            <ArrowBigLeftIcon stroke-width="1.25" />
                        </Button>
                        {{ activeOptionConfig!.title }}
                    </div>

                    <ScrollArea scroll-area-padding="none">
                        <ComponentLoadError v-if="subPanelError" :error="subPanelError" name="AccountPanel" class="flex-1" />
                        <Suspense v-else>
                            <template #default>
                                <component :is="OPTION_COMPONENT_MAP[activeOptionConfig?.id ?? '']" class="flex-1" />
                            </template>
                            <template #fallback>
                                <div class="flex flex-1 items-center justify-center">
                                    <LoaderCircleIcon class="animate-spin text-muted" />
                                </div>
                            </template>
                        </Suspense>
                    </ScrollArea>
                </div>
            </div>
        </DialogModal>
    </DialogLayout>
</template>
