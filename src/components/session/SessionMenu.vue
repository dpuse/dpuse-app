<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/account/Account.json';
import { useSessionStore } from '@/stores/sessionStore';
import { ExpandIcon, MonitorIcon, MoonIcon, ShrinkIcon, SunIcon } from 'lucide-vue-next';
import { useColorMode, useFullscreen } from '@vueuse/core';

// App Components
import ActionButton from '@/components/action/ActionButton.vue';
import ES from '@/components/icon/flags/ES.vue';
import GB from '@/components/icon/flags/GB.vue';
import Separator from '@/components/separator/Separator.vue';

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const colorMode = useColorMode(); // CSP requires hash for useColorMode's transition-disabling style. See console error message for required hash.
const sessionState = useSessionStore();
const { isFullscreen, toggle: toggleFullscreen, isSupported: fullScreenIsSupported } = useFullscreen();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleManageAccount() {}

async function handleSignOut(): Promise<void> {
    await sessionState.signOut();
}
</script>

<template>
    <div class="border-boundary bg-surface flex flex-col gap-y-2 overflow-y-auto overscroll-y-none rounded-md border px-4 py-3 shadow-md">
        <div class="flex flex-col gap-y-0.5">
            <div class="text-sm text-zinc-500">Appearance</div>
            <div class="flex gap-x-2">
                <ActionButton class="flex flex-col items-center text-xs" variant="iconSmall" @click="colorMode = 'dark'">
                    <MoonIcon class="size-4.5!" />
                    <span>Dark</span>
                </ActionButton>

                <ActionButton class="flex flex-col items-center text-xs" variant="iconSmall" @click="colorMode = 'light'">
                    <SunIcon class="size-4.5!" />
                    <span>Light</span>
                </ActionButton>

                <ActionButton class="flex flex-col items-center text-xs" variant="iconSmall" @click="colorMode = 'auto'">
                    <MonitorIcon class="size-4.5!" />
                    <span>System</span>
                </ActionButton>
            </div>
        </div>

        <div v-if="fullScreenIsSupported" class="flex flex-col gap-y-2">
            <Separator />
            <div class="flex flex-col gap-y-0.5">
                <ActionButton variant="listItem" @click="toggleFullscreen">
                    <div v-if="isFullscreen" class="flex gap-x-2">
                        <ShrinkIcon class="size-4.5!" />
                        <span class="text-sm text-zinc-500">Collapse fullscreen</span>
                    </div>

                    <div v-else class="flex gap-x-2">
                        <ExpandIcon class="size-4.5!" />
                        <span class="text-sm text-zinc-500">Expand fullscreen</span>
                    </div>
                </ActionButton>
            </div>
        </div>

        <div class="flex flex-col gap-y-2">
            <Separator />
            <div class="flex flex-col gap-y-0.5">
                <div class="text-sm text-zinc-500">Language</div>
                <div class="flex flex-col items-start gap-y-1">
                    <ActionButton class="flex w-full items-center justify-between text-sm" variant="listItem">
                        <div class="flex items-center gap-x-2">
                            <GB class="size-4.5" />
                            <span>English</span>
                        </div>
                        <span>en</span>
                    </ActionButton>

                    <ActionButton class="flex w-full items-center justify-between text-sm" variant="listItem">
                        <div class="flex w-full items-center justify-between">
                            <div class="flex items-center gap-x-2">
                                <ES class="size-4.5" />
                                <span>Español</span>
                            </div>
                            <span>es</span>
                        </div>
                    </ActionButton>
                </div>
            </div>
        </div>

        <Separator class="my-1" />
        <ActionButton class="min-w-50 justify-start" @click="handleManageAccount">Manage Account</ActionButton>

        <Separator class="my-1" />
        <!-- <ActionButton class="min-w-50 justify-start" variant="outline" @click="handleSignOut">Outline</ActionButton>
        <ActionButton class="min-w-50 justify-start" variant="ghost" @click="handleSignOut">Ghost</ActionButton>
        <ActionButton class="min-w-50 justify-start" variant="positive" @click="handleSignOut">All is ok</ActionButton>
        <ActionButton class="min-w-50 justify-start" variant="primary" @click="handleSignOut">Sign in / Register</ActionButton> -->
        <ActionButton class="min-w-50 justify-start" variant="guarded" @click="handleSignOut">{{ t(T, 'Sign_out') }}</ActionButton>
        <!-- <ActionButton class="min-w-50 justify-start" variant="destructive" @click="handleSignOut">Delete account</ActionButton> -->
    </div>
</template>
