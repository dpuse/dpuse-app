<script setup lang="ts">
// External Dependencies
import { ArrowBigLeftIcon } from 'lucide-vue-next';
import { shallowRef } from 'vue';
import { useRouter } from 'vue-router';

// App Core
import { t } from '@/locales';
import T from '@/locales/views/account/Account.json';
import { useSessionStore } from '@/stores/sessionStore';

// App Components
import ActionButton from '@/components/action/ActionButton.vue';
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import Header from '@/components/header/Header.vue';
import Separator from '@/components/separator/Separator.vue';

// Properties
const { displayIsWide } = defineProps<{ displayIsWide: boolean }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const router = useRouter();
const sessionState = useSessionStore();

// Account options
type OptionLocalisedConfig = { id: string; type?: 'label'; icon?: string; label: string; title?: string };
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
    // router.replace({ name: 'account', query: router.currentRoute.value.query });
    activeOptionConfig.value = undefined;
}

async function handleSignOut(): Promise<void> {
    await sessionState.signOut();
    // router.replace({ name: 'workflow', query: router.currentRoute.value.query });
}

function initialiseActiveOptionConfig(): OptionLocalisedConfig | undefined {
    const routeName = router.currentRoute.value.name;
    if (routeName === 'account') {
        if (displayIsWide) {
            // router.replace({ name: 'managePersonalDetails', query: router.currentRoute.value.query });
            return optionConfigs[1];
        }
        return;
    } else {
        const activeOptionConfig = optionConfigs.find((config) => config.id === router.currentRoute.value.name);
        if (!activeOptionConfig) {
            if (displayIsWide) {
                // router.replace({ name: 'managePersonalDetails', query: router.currentRoute.value.query });
                return optionConfigs[1];
            }
            return;
        }
        return activeOptionConfig;
    }
}
</script>

<template>
    <div class="fixed inset-0 z-50">
        <div
            role="dialog"
            aria-modal="true"
            class="bg-surface text-content z-10 h-full max-h-full w-full max-w-full overflow-hidden overflow-y-auto overscroll-y-none sm:absolute sm:top-[5%] sm:left-1/2 sm:h-auto sm:max-h-[90vh] sm:w-sm sm:-translate-x-1/2 sm:rounded-lg"
            tabindex="-1"
        >
            <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'Workbench') }]" :title="t(T, 'Account')" :display-is-wide="displayIsWide" />

            <div class="flex flex-1 overflow-y-hidden">
                <BenchtopScroller v-if="displayIsWide || !activeOptionConfig" class="border-boundary flex flex-1 flex-col border-r px-4 pt-4 pb-7 md:flex-none">
                    <div class="divide-separator flex flex-1 flex-col gap-y-2">
                        <ActionButton class="min-w-50 justify-start" variant="warning" @click="handleSignOut">{{ t(T, 'Sign_out') }}</ActionButton>

                        <Separator class="mt-2" />

                        <div class="flex flex-1 flex-col gap-y-2">
                            <template v-for="optionConfig of optionConfigs" :key="optionConfig.id">
                                <div v-if="optionConfig.type === 'label'" class="text-muted mt-2 text-xs font-medium">{{ optionConfig.label }}</div>
                                <ActionButton
                                    v-else
                                    class="min-w-50 justify-start"
                                    :is-active="router.currentRoute.value.name === optionConfig.id && displayIsWide"
                                    :to="{ name: optionConfig.id, query: router.currentRoute.value.query }"
                                    variant="item"
                                    @click="activeOptionConfig = optionConfig"
                                >
                                    {{ optionConfig.label }}
                                </ActionButton>
                            </template>
                        </div>
                    </div>

                    <div class="flex flex-none flex-col gap-y-2 pt-2">
                        <Separator class="mt-2" />

                        <div class="text-muted mt-2 text-xs font-medium">{{ t(T, 'Critical_Actions') }}</div>

                        <ActionButton class="min-w-50 justify-start" :to="{ name: 'deleteAccount', query: router.currentRoute.value.query }" variant="danger">
                            {{ t(T, 'Delete_account') }}
                        </ActionButton>
                    </div>
                </BenchtopScroller>

                <div v-if="displayIsWide || activeOptionConfig" class="flex flex-1 flex-col">
                    <div class="border-separator mx-4 flex h-12 flex-none items-center gap-x-1 border-b">
                        <ActionButton v-if="!displayIsWide" variant="iconSmall" @click="handleBack">
                            <ArrowBigLeftIcon stroke-width="1.25" />
                        </ActionButton>
                        {{ activeOptionConfig!.title }}
                    </div>

                    <div class="flex-1">
                        <!-- <RouterView /> -->
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
