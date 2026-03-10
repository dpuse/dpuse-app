<script setup lang="ts">
// App Core
import T from '@/locales/components/session/SessionMenu.json';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/sessionStore';
import { type BasicColorSchema, useColorMode, useFullscreen } from '@vueuse/core';
import { computed, nextTick } from 'vue';
import { ExpandIcon, MonitorIcon, MoonIcon, ShrinkIcon, SunIcon, XIcon } from 'lucide-vue-next';
import { type LocaleId, localeId, SUPPORTED_LANGUAGES, t } from '@/locales';

// App Components
import Button from '@/components/button/Button.vue';
import Separator from '@/components/separator/Separator.vue';

// Properties & Emits
const { sheet } = defineProps<{ sheet?: boolean }>();
const emit = defineEmits<{ (event: 'complete'): void }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const colorMode = useColorMode(); // CSP requires hash for useColorMode's transition-disabling style. See console error message for required hash.
const { isFullscreen, toggle: toggleFullscreen, isSupported: fullScreenIsSupported } = useFullscreen();
const sessionState = useSessionStore();
const router = useRouter();

// Local States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessionIsAuthenticated = computed(() => sessionState.isAuthenticated);

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleManageAccount(): void {
    router.replace({ query: { ...router.currentRoute.value.query, dialog: 'acctMgmt' } });
    emit('complete');
}

function handleSetAppearance(mode: BasicColorSchema): void {
    colorMode.value = mode;
    nextTick().then(() => emit('complete'));
}

function handleSetLanguage(id: LocaleId): void {
    localeId.value = id;
    emit('complete');
}

function handleSignInRegister(): void {
    router.replace({ query: { ...router.currentRoute.value.query, dialog: 'auth' } });
    emit('complete');
}

function handleSignOut(): void {
    sessionState.signOut().then(() => emit('complete'));
}

function toggleWindowExpansion(): void {
    toggleFullscreen();
    emit('complete');
}
</script>

<template>
    <div class="border-boundary bg-surface flex flex-col overflow-y-auto overscroll-y-none rounded-md border px-4 py-3 shadow-md">
        <div v-if="sheet" class="mb-2 flex items-center justify-end">
            <Button variant="iconSmall" @click="emit('complete')"><XIcon class="size-4.5!" /></Button>
        </div>
        <div class="text-muted mb-1 text-sm">{{ t(T, 'Appearance') }}</div>
        <div class="flex gap-x-2">
            <Button class="flex flex-col items-center text-xs" variant="iconSmall" @click="handleSetAppearance('dark')"> <MoonIcon class="size-4.5!" />{{ t(T, 'Dark') }} </Button>

            <Button class="flex flex-col items-center text-xs" variant="iconSmall" @click="handleSetAppearance('light')"> <SunIcon class="size-4.5!" />{{ t(T, 'Light') }} </Button>

            <Button class="flex flex-col items-center text-xs" variant="iconSmall" @click="handleSetAppearance('auto')">
                <MonitorIcon class="size-4.5!" />{{ t(T, 'System') }}
            </Button>
        </div>

        <Separator v-if="fullScreenIsSupported" class="my-2.5" />
        <Button v-if="fullScreenIsSupported" class="flex gap-x-2 text-sm" variant="listItem" @click="toggleWindowExpansion">
            <template v-if="isFullscreen"><ShrinkIcon class="size-4.5!" />{{ t(T, 'Collapse_window') }}</template>
            <template v-else><ExpandIcon class="size-4.5!" />{{ t(T, 'Expand_window') }}</template>
        </Button>

        <Separator class="my-2.5" />
        <div class="text-muted mb-1 text-sm">{{ t(T, 'Language') }}</div>
        <Button v-for="lang in SUPPORTED_LANGUAGES" :key="lang.id" class="mt-1 flex w-full items-center gap-x-2 text-sm" variant="listItem" @click="handleSetLanguage(lang.id)">
            <img :src="`https://flagcdn.com/${lang.flag}.svg`" class="h-3.5 w-5 object-cover" :alt="lang.label" />{{ lang.label }}
        </Button>

        <Separator v-if="sessionIsAuthenticated" class="my-2.5" />
        <Button v-if="sessionIsAuthenticated" class="min-w-50 justify-start" @click="handleManageAccount">{{ t(T, 'Manage_account') }}</Button>

        <Separator class="my-2.5" />
        <Button v-if="sessionIsAuthenticated" class="min-w-50 justify-start" variant="guarded" @click="handleSignOut">{{ t(T, 'Sign_out') }}</Button>
        <Button v-else class="min-w-50 justify-start" variant="primary" @click="handleSignInRegister">{{ t(T, 'Sign_in/Register') }}</Button>
    </div>
</template>
