<script setup lang="ts">
// Workbench core
import { t } from '@/locales';
import TRANSLATIONS from '@/locales/Account.json';
import { useSessionStore } from '@/stores/sessionStore';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';
import TextAction from '@/components/base/TextAction.vue';

// Properties
defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isDisplayWide: boolean }>();

// Constants
const LINK_CLASSES = 'rounded-md focus:outline-2 outline-offset-2 outline-zinc-400 dark:outline-zinc-500';

// Global state
const sessionState = useSessionStore();

const optionConfigs = [
    { id: 'profile', type: 'label', label: { en: 'Profile' } },
    { id: 'managePersonalDetails', icon: '', label: { en: 'Personal details' } },
    { id: 'manageSubscription', icon: '', label: { en: 'Subscription & billing' } },
    { id: 'managePreferences', icon: '', label: { en: 'Preferences' } },
    { id: 'security', type: 'label', label: { en: 'Security' } },
    { id: 'manageAccess', icon: '', label: { en: 'Access' } },
    { id: 'manageSessions', icon: '', label: { en: 'Active sessions' } },
    { id: 'reviewActivity', icon: '', label: { en: 'Recent activity' } },
    { id: 'integrations', type: 'label', label: { en: 'Integrations' } },
    { id: 'manageDataServiceTokens', icon: '', label: { en: 'Data service tokens' } },
    { id: 'development', type: 'label', label: { en: 'Development' } },
    { id: 'generateToken', icon: '', label: { en: 'API token' } }
];

// Sign out
async function handleSignOut(): Promise<void> {
    await sessionState.signOut();
}
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-display-wide="isDisplayWide">
        <Header :title="t(TRANSLATIONS, 'account')" :is-display-wide="isDisplayWide" />

        <div class="flex flex-1 overflow-y-hidden">
            <BenchtopScroller class="border-border flex flex-none flex-col border-r p-4">
                <div class="divide-separator flex flex-1 flex-col gap-y-2">
                    <button type="button" :class="LINK_CLASSES">
                        <TextAction class="w-full font-normal" variant="warning" @click="handleSignOut">{{ t(TRANSLATIONS, 'signOut') }}</TextAction>
                    </button>

                    <div class="flex flex-1 flex-col gap-y-2">
                        <template v-for="optionConfig of optionConfigs" :key="optionConfig.id">
                            <div v-if="optionConfig.type === 'label'" class="mt-2 text-xs font-medium uppercase">{{ optionConfig.label.en }}</div>
                            <RouterLink v-else :class="LINK_CLASSES" :to="{ name: optionConfig.id }" as-child>
                                <TextAction
                                    aria-hidden="true"
                                    class="w-full justify-start font-normal"
                                    :variant="optionConfig.id === 'deleteAccount' ? 'destructive' : 'secondary'"
                                >
                                    {{ optionConfig.label.en }}
                                </TextAction>
                            </RouterLink>
                        </template>
                    </div>
                </div>

                <div class="flex flex-none flex-col gap-y-2 pt-2">
                    <RouterLink :to="{ name: 'deleteAccount' }" as-child>
                        <TextAction class="w-full font-normal" variant="destructive">{{ t(TRANSLATIONS, 'deleteAccount') }}</TextAction>
                    </RouterLink>
                </div>
            </BenchtopScroller>

            <div class="flex-1">
                <RouterView />
            </div>
        </div>
    </BenchtopShell>
</template>
