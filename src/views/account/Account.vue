<script setup lang="ts">
// Global state dependencies.
import { useSessionStore } from '@/stores/sessionStore';

import Button from '@/components/ui/button/Button.vue';
import LoginForm from '@/components/new-york-v4/blocks/login-05/components/LoginForm.vue';
import Separator from '@/components/ui/separator/Separator.vue';

const sessionState = useSessionStore();

const optionConfigs = [
    { id: 'auditTasks', type: 'label', label: { en: 'Profile' } },
    { id: 'managePersonalDetails', icon: '', label: { en: 'Personal details' } },
    { id: 'manageBillingDetails', icon: '', label: { en: 'Subscription & billing' } },
    { id: 'manageDataServices', icon: '', label: { en: 'Data services' } },
    { id: 'manageSettings', icon: '', label: { en: 'Preferences' } },
    { id: 'manage', type: 'label', label: { en: 'Security' } },
    { id: 'manageAccess', icon: '', label: { en: 'Access' } },
    { id: 'manageSessions', icon: '', label: { en: 'Active sessions' } },
    { id: 'reviewActivity', icon: '', label: { en: 'Recent activity' } },
    { id: 'developmentTasks', type: 'label', label: { en: 'Development' } },
    { id: 'generateToken', icon: '', label: { en: 'API token' } }
    // { id: 'dangerZone', type: 'label', label: { en: 'Advanced' } },
    // { id: 'deleteAccount', icon: '', label: { en: 'Account deletion' } }
];
</script>

<template>
    <div class="bg-muted flex h-full w-full flex-col items-center justify-center rounded-b-lg">
        <div v-if="!sessionState.sessionStatus.isAuthenticated" class="flex w-full flex-1 flex-col overflow-hidden rounded-b-lg border-x border-b">
            <div class="bg-background flex h-14 w-full flex-none items-center border-b pl-4 text-lg font-light">Account</div>

            <div class="flex flex-1 overflow-hidden">
                <div class="bg-background flex flex-none flex-col overflow-y-auto border-r p-4">
                    <div class="flex flex-1 flex-col gap-y-2">
                        <Button class="font-normal" variant="warning" @click="sessionState.signOut()">Sign out</Button>
                        <Separator class="my-2" />

                        <template v-for="optionConfig of optionConfigs" :key="optionConfig.id">
                            <div v-if="optionConfig.type === 'label'" class="mt-1 text-xs">{{ optionConfig.label.en }}</div>
                            <RouterLink v-else :to="{ name: optionConfig.id }" as-child>
                                <Button class="w-full justify-start font-normal" :variant="optionConfig.id === 'deleteAccount' ? 'destructive' : 'secondary'">
                                    {{ optionConfig.label.en }}
                                </Button>
                            </RouterLink>
                        </template>
                    </div>

                    <div class="flex flex-none flex-col gap-y-2 pt-2">
                        <Separator class="my-2" />
                        <Button class="font-normal" variant="destructive" @click="sessionState.signOut()">Delete account</Button>
                    </div>
                </div>

                <div class="flex-1">
                    <RouterView />
                </div>
            </div>
        </div>

        <div v-else class="bg-background flex flex-col items-center justify-center gap-6 rounded-lg p-6 md:p-10">
            <div class="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    </div>
</template>
