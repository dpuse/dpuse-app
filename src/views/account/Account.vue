<script setup lang="ts">
// Global state dependencies.
import { useSessionStore } from '@/stores/sessionStore';

// import { GalleryVerticalEnd } from 'lucide-vue-next';

import Button from '@/components/ui/button/Button.vue';
import LoginForm from '@/components/new-york-v4/blocks/login-04/components/LoginForm.vue';

const sessionState = useSessionStore();
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <div v-if="sessionState.sessionStatus.isAuthenticated">
            <Button @click="sessionState.signOut()">Sign Out</Button>
        </div>

        <!-- <div v-else class="bg-faint flex flex-col items-center justify-center gap-6 rounded-lg p-6 md:p-10">
            <div class="flex w-full max-w-sm flex-col gap-6">
                <a href="#" class="flex items-center gap-2 self-center font-medium">
                    <div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                        <GalleryVerticalEnd class="size-4" />
                    </div>
                    Data Positioning
                </a>
                <LoginForm />
            </div>
        </div> -->

        <div v-else class="bg-muted flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
            <div class="w-full max-w-sm md:max-w-4xl">
                <LoginForm />
            </div>
        </div>
    </div>
</template>
