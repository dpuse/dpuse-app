<script setup lang="ts">
// Vendor Dependencies
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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
const properties = defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isDisplayWide: boolean }>();

// Global state
const route = useRoute();
const router = useRouter();
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

const activePanelId = ref<'index' | 'detail'>('index');

watch(
    () => properties.isDisplayWide,
    () => {}
);

// Sign out
async function handleSignOut(): Promise<void> {
    await sessionState.signOut();
    router.replace({ name: 'workflow' });
}
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-display-wide="isDisplayWide">
        <Header :title="t(TRANSLATIONS, 'account')" :is-display-wide="isDisplayWide" />

        <div class="flex flex-1 overflow-y-hidden">
            <BenchtopScroller v-if="isDisplayWide || activePanelId === 'index'" class="border-border flex flex-1 flex-col border-r px-4 pt-4 pb-6 md:flex-none">
                <div class="divide-separator flex flex-1 flex-col gap-y-2">
                    <button class="group outline-none">
                        <TextActionContent variant="warning" @click="handleSignOut">{{ t(TRANSLATIONS, 'signOut') }}</TextActionContent>
                    </button>

                    <div class="flex flex-1 flex-col gap-y-2">
                        <template v-for="optionConfig of optionConfigs" :key="optionConfig.id">
                            <div v-if="optionConfig.type === 'label'" class="text-foreground-secondary mt-2 text-xs font-medium">{{ optionConfig.label.en }}</div>
                            <RouterLink v-else class="group outline-none" :to="{ name: optionConfig.id }" @click="activePanelId = 'detail'">
                                <TextActionContent :is-active="route.name === optionConfig.id">
                                    {{ optionConfig.label.en }}
                                </TextActionContent>
                            </RouterLink>
                        </template>
                    </div>
                </div>

                <div class="flex flex-none flex-col gap-y-2 pt-2">
                    <div class="text-foreground-secondary mt-2 text-xs font-medium">{{ t(TRANSLATIONS, 'advancedSettings') }}</div>
                    <RouterLink class="group outline-none" :to="{ name: 'deleteAccount' }">
                        <TextActionContent variant="danger">{{ t(TRANSLATIONS, 'deleteAccount') }}</TextActionContent>
                    </RouterLink>
                </div>
            </BenchtopScroller>

            <div v-if="isDisplayWide || activePanelId === 'detail'" class="flex-1">
                <button @click="activePanelId = 'index'">Back</button>
                <RouterView />
            </div>
        </div>
    </BenchtopShell>
</template>
