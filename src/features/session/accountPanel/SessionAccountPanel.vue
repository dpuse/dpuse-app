<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowBigLeftIcon } from '@lucide/vue';
import { useRoute } from 'vue-router';
import { type Component, shallowRef, watch } from 'vue';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities';
import { t } from '@/state/locale';
import { TEXT } from './SessionAccountPanel_.json';
import { viewportIsWide } from '@/state/appLayout';

// ── Static Components
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import IconButton from '@/components/ui/action/IconButton.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import ItemButton from '@/components/ui/action/ItemButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface OptionLocalisedConfig {
    id: string;
    type?: 'label';
    icon?: string;
    label: string;
    title?: string;
    isDestructive?: boolean;
}
// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

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
// Each panel is named for itself, not for this one. The name is what a load failure reports and what '?fault=panel:'
// targets, so sharing the parent's name left every one of them unreportable and unreachable individually.
const OPTION_COMPONENT_MAP: Record<string, Component> = {
    managePersonalDetails: defineAsyncPanel(() => import('./ManagePersonalDetailsPanel.vue'), 'ManagePersonalDetailsPanel'),
    manageSubscription: defineAsyncPanel(() => import('./ManageSubscriptionPanel.vue'), 'ManageSubscriptionPanel'),
    managePreferences: defineAsyncPanel(() => import('./ManagePreferencesPanel.vue'), 'ManagePreferencesPanel'),
    manageAccess: defineAsyncPanel(() => import('./ManageAccessPanel.vue'), 'ManageAccessPanel'),
    manageSessions: defineAsyncPanel(() => import('./ManageSessionsPanel.vue'), 'ManageSessionsPanel'),
    reviewActivity: defineAsyncPanel(() => import('./ReviewActivityPanel.vue'), 'ReviewActivityPanel'),
    manageDataServiceTokens: defineAsyncPanel(() => import('./ManageDataServiceTokensPanel.vue'), 'ManageDataServiceTokensPanel'),
    generateToken: defineAsyncPanel(() => import('./GenerateTokenPanel.vue'), 'GenerateTokenPanel'),
    deleteAccount: defineAsyncPanel(() => import('./DeleteAccountPanel.vue'), 'DeleteAccountPanel')
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

const activeOptionConfig = shallowRef<OptionLocalisedConfig | undefined>(initialiseActiveOptionConfig()); // TODO: Use route to set this!

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

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
    <DialogHeader class="flex-none" :title="t(TEXT, 'manageAccount.title')" />

    <div class="flex min-h-0 flex-1">
        <div v-if="viewportIsWide || !activeOptionConfig" class="flex flex-1 flex-col gap-y-1 pl-4">
            <ScrollArea>
                <div class="flex flex-1 flex-col gap-y-1 pb-6">
                    <template v-for="optionConfig in OPTION_CONFIGS" :key="optionConfig.id">
                        <div v-if="optionConfig.type === 'label'" class="mt-3 text-xs font-medium text-muted">{{ optionConfig.label }}</div>
                        <ItemButton
                            v-else
                            class="inline-flex min-w-50 justify-start"
                            :is-active="route.name === optionConfig.id && viewportIsWide"
                            :variant="optionConfig.isDestructive ? 'destructive' : 'neutral'"
                            @click="activeOptionConfig = optionConfig"
                        >
                            {{ optionConfig.label }}
                        </ItemButton>
                    </template>
                </div>

                <!-- <div class="text-muted mt-2 text-xs font-medium">{{ t(TEXT, 'criticalActions.label') }}</div> -->

                <!-- <RectangleButton class="min-w-50 justify-start" :to="{ name: 'deleteAccount', query: route.query }" variant="destructive">
                          {{ t(TEXT, 'deleteAccount.label') }}
                        </RectangleButton> -->
            </ScrollArea>
        </div>

        <div v-if="viewportIsWide || activeOptionConfig" class="flex flex-1 flex-col px-4">
            <div class="flex h-12 flex-none items-center gap-x-1 border-b border-separator">
                <IconButton v-if="!viewportIsWide" :accessible-label="t(TEXT, 'back.label')" size="sm" @click="handleBack">
                    <ArrowBigLeftIcon stroke-width="1.25" />
                </IconButton>
                {{ activeOptionConfig!.title }}
            </div>

            <ScrollArea>
                <component :is="OPTION_COMPONENT_MAP[activeOptionConfig?.id ?? '']" class="flex-1" />
            </ScrollArea>
        </div>
    </div>
</template>
