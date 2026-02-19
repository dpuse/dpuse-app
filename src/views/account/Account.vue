<script setup lang="ts">
// Vendor Dependencies
import { shallowRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// App core
import { t } from '@/locales';
import T from '@/locales/views/account/Account.json';
import { useSessionStore } from '@/stores/sessionStore';

// App components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';
import TextActionContent from '@/components/action/TextActionContent.vue';

// Types
type OptionLocalisedConfig = { id: string; type?: 'label'; icon?: string; label: string; title?: string };

// Properties
const properties = defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isWideDisplay: boolean }>();

// Global state
const route = useRoute();
const router = useRouter();
const sessionState = useSessionStore();

const optionConfigs: OptionLocalisedConfig[] = [
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
    { id: 'generateToken', icon: '', label: 'API token' }
];

const activeOptionConfig = shallowRef<OptionLocalisedConfig | undefined>(initialiseActiveOptionConfig()); // TODO: Use route to set this!

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleBack(): void {
    router.replace({ name: 'account' });
    activeOptionConfig.value = undefined;
}

async function handleSignOut(): Promise<void> {
    await sessionState.signOut();
    router.replace({ name: 'workflow' });
}

function initialiseActiveOptionConfig(): OptionLocalisedConfig | undefined {
    const routeName = route.name;
    if (routeName === 'account') {
        if (properties.isWideDisplay) {
            router.replace({ name: 'managePersonalDetails' });
            return optionConfigs[1];
        }
        return;
    } else {
        const activeOptionConfig = optionConfigs.find((config) => config.id === route.name);
        if (!activeOptionConfig) {
            if (properties.isWideDisplay) {
                router.replace({ name: 'managePersonalDetails' });
                return optionConfigs[1];
            }
            return;
        }
        return activeOptionConfig;
    }
}
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-wide-display="isWideDisplay">
        <Header
            :breadcrumbs="[{ id: 'benchtop', label: t(T, 'overline') }]"
            :title="t(T, 'title')"
            :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay"
            :is-wide-display="isWideDisplay"
        />

        <div class="flex flex-1 overflow-y-hidden">
            <BenchtopScroller v-if="isWideDisplay || !activeOptionConfig" class="border-border flex flex-1 flex-col border-r px-4 pt-4 pb-6 md:flex-none">
                <div class="divide-separator flex flex-1 flex-col gap-y-2">
                    <button class="group min-w-50 outline-none">
                        <TextActionContent variant="warning" @click="handleSignOut">{{ t(T, 'signOut') }}</TextActionContent>
                    </button>

                    <!-- Separator -->
                    <div class="bg-separator mt-2 h-px" />

                    <div class="flex flex-1 flex-col gap-y-2">
                        <template v-for="optionConfig of optionConfigs" :key="optionConfig.id">
                            <div v-if="optionConfig.type === 'label'" class="text-foreground-secondary mt-2 text-xs font-medium">{{ optionConfig.label }}</div>
                            <RouterLink v-else class="group min-w-50 outline-none" :to="{ name: optionConfig.id }" @click="activeOptionConfig = optionConfig">
                                <TextActionContent :is-active="route.name === optionConfig.id && isWideDisplay">
                                    {{ optionConfig.label }}
                                </TextActionContent>
                            </RouterLink>
                        </template>
                    </div>
                </div>

                <div class="flex flex-none flex-col gap-y-2 pt-2">
                    <div class="text-foreground-secondary mt-2 text-xs font-medium">{{ t(T, 'criticalActions') }}</div>
                    <RouterLink class="group min-w-50 outline-none" :to="{ name: 'deleteAccount' }">
                        <TextActionContent variant="danger">{{ t(T, 'deleteAccount') }}</TextActionContent>
                    </RouterLink>
                </div>
            </BenchtopScroller>

            <div v-if="isWideDisplay || activeOptionConfig" class="flex flex-1 flex-col">
                <div class="border-separator mx-4 flex h-12 flex-none items-center border-b">
                    <button v-if="!isWideDisplay" @click="handleBack">Back</button>
                    {{ activeOptionConfig!.title }}
                </div>

                <div class="flex-1">
                    <RouterView />
                </div>
            </div>
        </div>
    </BenchtopShell>
</template>
