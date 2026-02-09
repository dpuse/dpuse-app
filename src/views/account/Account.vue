<script setup lang="ts">
// Workbench core
import { t } from '@/locales';
import TRANSLATIONS from '@/locales/Account.json';
import { useSessionStore } from '@/stores/sessionStore';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';
import TextActionContent from '@/components/base/TextActionContent.vue';

// Properties
defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isDisplayWide: boolean }>();

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
                    <button class="dpu-action">
                        <TextActionContent variant="warning" @click="handleSignOut">{{ t(TRANSLATIONS, 'signOut') }}</TextActionContent>
                    </button>

                    <div class="flex flex-1 flex-col gap-y-2">
                        <template v-for="optionConfig of optionConfigs" :key="optionConfig.id">
                            <div v-if="optionConfig.type === 'label'" class="text-foreground-secondary mt-2 text-xs font-medium">{{ optionConfig.label.en }}</div>
                            <RouterLink v-else class="dpu-action" :to="{ name: optionConfig.id }">
                                <TextActionContent>
                                    {{ optionConfig.label.en }}
                                </TextActionContent>
                            </RouterLink>
                        </template>
                    </div>
                </div>

                <div class="flex flex-none flex-col gap-y-2 pt-2">
                    <div class="text-foreground-secondary mt-2 text-xs font-medium">{{ t(TRANSLATIONS, 'advancedSettings') }}</div>
                    <RouterLink class="dpu-action" :to="{ name: 'deleteAccount' }">
                        <TextActionContent variant="danger">{{ t(TRANSLATIONS, 'deleteAccount') }}</TextActionContent>
                    </RouterLink>
                </div>
            </BenchtopScroller>

            <div class="flex-1">
                <RouterView />
            </div>
        </div>
    </BenchtopShell>
</template>
