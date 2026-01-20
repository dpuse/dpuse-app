<script setup lang="ts">
// Global state dependencies.
import { useSessionStore } from '@/stores/sessionStore';

import Button from '@/components/ui/button/Button.vue';
import LoginForm from '@/components/new-york-v4/blocks/login-05/components/LoginForm.vue';

const sessionState = useSessionStore();

const settingConfigs = [{ id: '1', label: { en: '' } }];
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <div v-if="!sessionState.sessionStatus.isAuthenticated" class="flex h-full w-full">
            <div class="flex-none flex-col">
                <Button variant="warning" @click="sessionState.signOut()">Sign Out</Button>

                <div>
                    <div v-for="settingConfig of settingConfigs" :key="settingConfig.id">{{ settingConfig.id }}</div>
                </div>
            </div>

            <div class="flex-1"></div>
        </div>

        <div v-else class="bg-background flex flex-col items-center justify-center gap-6 rounded-lg p-6 md:p-10">
            <div class="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    </div>
</template>
