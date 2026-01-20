<script setup lang="ts">
// Global state dependencies.
import { useSessionStore } from '@/stores/sessionStore';

import Button from '@/components/ui/button/Button.vue';
import LoginForm from '@/components/new-york-v4/blocks/login-05/components/LoginForm.vue';

const sessionState = useSessionStore();
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <div v-if="sessionState.sessionStatus.isAuthenticated">
            <Button @click="sessionState.signOut()">Sign Out</Button>
        </div>

        <div v-else class="bg-background flex flex-col items-center justify-center gap-6 rounded-lg p-6 md:p-10">
            <div class="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    </div>
</template>
