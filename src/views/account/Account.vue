<script setup lang="ts">
// Global state dependencies.
import { useSessionStore } from '@/stores/sessionStore';

import Button from '@/components/ui/button/Button.vue';
import LoginForm from '@/components/new-york-v4/blocks/login-05/components/LoginForm.vue';

const sessionState = useSessionStore();

const optionConfigs = [
    { id: 'manage', type: 'label', label: { en: 'Manage' } },
    { id: 'manageAccess', icon: '', label: { en: 'Access' } },
    { id: 'manageBillingDetails', icon: '', label: { en: 'Billing Details' } },
    { id: 'manageDataServices', icon: '', label: { en: 'Data Services' } },
    { id: 'managePersonalDetails', icon: '', label: { en: 'Personal Details' } },
    { id: 'manageSessions', icon: '', label: { en: 'Sessions' } },
    { id: 'manageSettings', icon: '', label: { en: 'Settings' } },
    { id: 'auditTasks', type: 'label', label: { en: 'Audit Tasks' } },
    { id: 'reviewActivity', icon: '', label: { en: 'Review Activity' } },
    { id: 'developmentTasks', type: 'label', label: { en: 'Development Tasks' } },
    { id: 'generateToken', icon: '', label: { en: 'Generate Token' } }
];
</script>

<template>
    <div class="bg-muted flex h-full w-full flex-col items-center justify-center rounded-b-lg">
        <div class="bg-background flex h-14 w-full flex-none items-center border-x border-b pl-4 text-lg font-light">Account</div>

        <div v-if="!sessionState.sessionStatus.isAuthenticated" class="flex w-full flex-1 overflow-hidden rounded-b-lg border-x border-b">
            <div class="bg-background flex flex-none flex-col gap-y-2 overflow-y-auto border-r p-4">
                <Button class="font-normal" variant="warning" @click="sessionState.signOut()">Sign Out</Button>

                <template v-for="optionConfig of optionConfigs" :key="optionConfig.id">
                    <div v-if="optionConfig.type === 'label'" class="mt-1 text-xs">{{ optionConfig.label.en }}</div>
                    <router-link v-else :to="{ name: optionConfig.id }" as-child>
                        <Button class="min-w-40 justify-start font-normal" variant="secondary">
                            {{ optionConfig.label.en }}
                        </Button>
                    </router-link>
                </template>
            </div>

            <div class="flex-1">
                <RouterView />
            </div>
        </div>

        <div v-else class="bg-background flex flex-col items-center justify-center gap-6 rounded-lg p-6 md:p-10">
            <div class="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    </div>
</template>
