<script setup lang="ts">
// External Dependencies
import { ExpandIcon, MonitorIcon, MoonIcon, ShrinkIcon, SunIcon, XIcon } from 'lucide-vue-next';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import { type LocaleId, SUPPORTED_LANGUAGES } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import T from './SessionMenu.json';
import { displayIsWide, isPWA } from '@/state/appLayout';
import { isAuthenticated, signOut } from '@/state/session';
import { localeId, t } from '@/state/locale';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Separator from '@/components/ui/separator/Separator.vue';

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const APPEARANCE_KEY = 'dpuse-appearance';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ continue: [] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const currentAppearance = ref(localStorage.getItem(APPEARANCE_KEY) ?? 'auto');
const fullScreenIsSupported = document.fullscreenEnabled;
const isFullscreen = ref(!!document.fullscreenElement);
const route = useRoute();
const router = useRouter();

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => document.addEventListener('fullscreenchange', handleFullscreenChange));
onUnmounted(() => document.removeEventListener('fullscreenchange', handleFullscreenChange));

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function handleFullscreenChange(): void {
    isFullscreen.value = !!document.fullscreenElement;
}

function handleManageAccount(): void {
    router.replace({ query: { ...route.query, dlg: 'account' } });
    emit('continue');
}

function handleReloadApplication(): void {
    globalThis.location.reload(); // TODO: Should we "globalThis.location.href = '/your/path';" to also reset the url".
}

function handleSetAppearance(mode: 'dark' | 'light' | 'auto'): void {
    const prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'auto' && prefersDark);
    localStorage.setItem(APPEARANCE_KEY, mode);
    currentAppearance.value = mode;
    document.documentElement.classList.toggle('dark', isDark);
    nextTick().then(() => emit('continue'));
}

function handleSetLanguage(id: LocaleId): void {
    localeId.value = id;
    emit('continue');
}

function handleSignInRegister(): void {
    router.replace({ query: { ...route.query, dlg: 'auth' } });
    emit('continue');
}

function handleSignOut(): void {
    signOut().then(() => emit('continue'));
}

function handleToggleWindowExpansion(): void {
    toggleFullscreen();
    emit('continue');
}

async function toggleFullscreen(): Promise<void> {
    await (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
}
</script>
<template>
    <div
        class="border-boundary bg-surface flex flex-col overflow-y-auto overscroll-y-none px-4 shadow-md"
        :class="
            displayIsWide
                ? 'fixed bottom-[calc(var(--safe-bottom-offset)+2.5rem+0.5rem)] left-3 max-h-[calc(100vh-var(--safe-bottom-offset)-2.5rem-0.5rem-1rem)] overflow-y-auto overscroll-y-none rounded-md border py-4'
                : 'fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80dvh] max-w-lg overflow-y-auto overscroll-y-none rounded-t-2xl border-x border-t pt-6 pb-8'
        "
    >
        <Button v-if="!displayIsWide" class="absolute top-2 right-3" variant="iconLarge" @click="emit('continue')">
            <XIcon stroke-width="1.25" />
        </Button>

        <!-- Appearance -->
        <div class="text-muted mb-1 text-sm">{{ t(T, 'Appearance') }}</div>
        <div class="mt-1 flex gap-x-2">
            <Button
                class="flex flex-col items-center text-xs"
                :class="{ 'bg-zinc-200 dark:bg-zinc-600': currentAppearance === 'auto' }"
                variant="iconSmall"
                @click="handleSetAppearance('auto')"
            >
                <MonitorIcon class="size-4.5!" />{{ t(T, 'System') }}
            </Button>

            <Button
                class="flex flex-col items-center text-xs"
                :class="{ 'bg-zinc-200 dark:bg-zinc-600': currentAppearance === 'light' }"
                variant="iconSmall"
                @click="handleSetAppearance('light')"
            >
                <SunIcon class="size-4.5!" />{{ t(T, 'Light') }}
            </Button>

            <Button
                class="flex flex-col items-center text-xs"
                :class="{ 'bg-zinc-200 dark:bg-zinc-600': currentAppearance === 'dark' }"
                variant="iconSmall"
                @click="handleSetAppearance('dark')"
            >
                <MoonIcon class="size-4.5!" />{{ t(T, 'Dark') }}
            </Button>
        </div>

        <!-- Fullscreen -->
        <Separator v-if="fullScreenIsSupported" class="my-2.5" />
        <Button v-if="fullScreenIsSupported" class="flex flex-none items-center gap-x-2 text-sm" variant="listItem" @click="handleToggleWindowExpansion">
            <template v-if="isFullscreen"><ShrinkIcon class="size-4.5!" />{{ t(T, 'Collapse_window') }}</template>
            <template v-else><ExpandIcon class="size-4.5!" />{{ t(T, 'Expand_window') }}</template>
        </Button>

        <!-- Language -->
        <Separator class="my-2.5" />
        <div class="text-muted mb-1 text-sm">{{ t(T, 'Language') }}</div>
        <Button
            v-for="lang in SUPPORTED_LANGUAGES"
            :key="lang.id"
            class="mt-1 flex w-full flex-none items-center gap-x-2 text-sm"
            :class="{ 'bg-zinc-200 dark:bg-zinc-600': localeId === lang.id }"
            variant="listItem"
            @click="handleSetLanguage(lang.id)"
        >
            <!-- See https://flagpedia.net/index. -->
            <img :src="`/flags/${lang.flag}.svg`" class="h-4 w-5.5 object-fill ring-1 ring-black/10 dark:ring-white/10" :alt="lang.label" />
            <div>{{ lang.label }}</div>
        </Button>

        <!-- Manage Account -->
        <Separator v-if="isAuthenticated" class="my-2.5" />
        <Button v-if="isAuthenticated" class="min-w-50 justify-start" @click="handleManageAccount">{{ t(T, 'Manage_account') }}</Button>

        <!-- Reload -->
        <Separator v-if="isPWA" class="my-2.5" />
        <Button v-if="isPWA" class="min-w-50 justify-start" variant="guarded" @click="handleReloadApplication">{{ t(T, 'Reload_application') }}</Button>

        <!-- Sign In / Sign Out -->
        <Separator class="my-2.5" />
        <Button v-if="isAuthenticated" class="min-w-50 justify-start" variant="guarded" @click="handleSignOut">{{ t(T, 'Sign_out') }}</Button>
        <Button v-else class="min-w-50 justify-start" variant="primary" @click="handleSignInRegister">{{ t(T, 'Sign_in/Register') }}</Button>
    </div>
</template>
