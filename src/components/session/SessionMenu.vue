<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/account/Account.json';
import { useSessionStore } from '@/stores/sessionStore';
import { ExpandIcon, MonitorIcon, MoonIcon, ShrinkIcon, SunIcon } from 'lucide-vue-next';

// App Components
import ActionButton from '@/components/action/ActionButton.vue';
import AU from '@/components/icon/flags/AU.vue';
import ES from '@/components/icon/flags/ES.vue';
import GB from '@/components/icon/flags/GB.vue';
import Separator from '@/components/separator/Separator.vue';
import US from '@/components/icon/flags/US.vue';

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessionState = useSessionStore();

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
            <div class="flex gap-x-1.5">
                <ActionButton class="flex flex-col text-xs" variant="iconSmall"><MoonIcon class="size-4.5!" />Dark</ActionButton>
                <ActionButton class="flex flex-col text-xs" variant="iconSmall"><SunIcon class="size-4.5!" />Light</ActionButton>
                <ActionButton class="flex flex-col text-xs" variant="iconSmall"><MonitorIcon class="size-4.5!" />System</ActionButton>
            </div>
        </div>

        <Separator class="my-1" />
        <div class="flex flex-col gap-y-0.5">
            <!-- <div class="text-sm text-zinc-500">Full screen</div> -->
            <ActionButton class="justify-start" variant="iconSmall">
                <ExpandIcon class="size-4.5!" />
                <span class="text-sm text-zinc-500">Expand fullscreen</span>
            </ActionButton>
        </div>

        <Separator class="my-1" />
        <div class="flex flex-col gap-y-0.5">
            <div class="text-sm text-zinc-500">Language</div>
            <!-- <div>English | Español</div> -->
            <div class="flex flex-col items-start">
                <ActionButton class="flex w-full items-center justify-between" variant="listItem">
                    <div class="flex w-full items-center justify-between text-sm">
                        <div class="flex items-center gap-x-2">
                            <AU class="size-4.5" />
                            English
                        </div>
                        en-AU
                    </div>
                </ActionButton>
                <ActionButton class="flex w-full items-center justify-between text-sm" variant="listItem">
                    <div class="flex w-full items-center justify-between">
                        <div class="flex items-center gap-x-2">
                            <ES class="size-4.5" />
                            Español
                        </div>
                        es-ES
                    </div>
                </ActionButton>
                <ActionButton class="flex w-full items-center justify-between text-sm" variant="listItem">
                    <div class="flex w-full items-center justify-between">
                        <div class="flex items-center gap-x-2">
                            <GB class="size-4.5" />
                            English
                        </div>
                        en-GB
                    </div>
                </ActionButton>
                <ActionButton class="flex w-full items-center justify-between text-sm" variant="listItem">
                    <div class="flex w-full items-center justify-between">
                        <div class="flex items-center gap-x-2">
                            <US class="size-4.5" />
                            English
                        </div>
                        en-US
                    </div>
                </ActionButton>
            </div>
        </div>

        <Separator class="my-1" />
        <ActionButton class="min-w-50 justify-start" @click="handleManageAccount">Manage Account</ActionButton>

        <Separator class="my-1" />
        <ActionButton class="min-w-50 justify-start" variant="outline" @click="handleSignOut">Outline</ActionButton>
        <ActionButton class="min-w-50 justify-start" variant="ghost" @click="handleSignOut">Ghost</ActionButton>
        <ActionButton class="min-w-50 justify-start" variant="positive" @click="handleSignOut">All is ok</ActionButton>
        <ActionButton class="min-w-50 justify-start" variant="primary" @click="handleSignOut">Sign in / Register</ActionButton>
        <ActionButton class="min-w-50 justify-start" variant="guarded" @click="handleSignOut">{{ t(T, 'Sign_out') }}</ActionButton>
        <ActionButton class="min-w-50 justify-start" variant="destructive" @click="handleSignOut">Delete account</ActionButton>
    </div>
</template>
