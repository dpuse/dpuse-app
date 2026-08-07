<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue';
import { ExpandIcon, MonitorIcon, MoonIcon, ShrinkIcon, SunIcon } from '@lucide/vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { formatNumberAsDuration } from '@dpuse/dpuse-shared/utilities';
import { type LocaleId, SUPPORTED_LANGUAGES } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import T from './SessionMenu.json';
import { expiresIn, lifetime, sessionIsAuthenticated, setSessionExpiryTimer, signOut } from '@/state/session';
import { isPWA, viewportIsWide } from '@/state/appLayout';
import { localeId, t } from '@/state/locale';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import CloseButton from '@/components/ui/button/CloseButton.vue';
import ListItemButton from '@/components/ui/button/ListItemButton.vue';
import ScrollAreaFit from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const APPEARANCE_KEY = 'dpuse-appearance';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const emit = defineEmits<{ continue: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const currentAppearance = ref(localStorage.getItem(APPEARANCE_KEY) ?? 'auto');
const isFullScreenSupported = document.fullscreenEnabled;
const screenIsFullscreen = ref(!!document.fullscreenElement);
const route = useRoute();
const router = useRouter();

const elapsed = computed(() => {
    if (lifetime.value == null || lifetime.value === 0) return 0;
    return ((lifetime.value - (expiresIn.value ?? 0)) / lifetime.value) * 100;
});

const formattedExpiresIn = computed(() => formatNumberAsDuration(expiresIn.value, 'secs'));

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

setSessionExpiryTimer(true);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => document.addEventListener('fullscreenchange', handleFullscreenChange));

onUnmounted(() => {
    setSessionExpiryTimer();
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleFullscreenChange(): void {
    screenIsFullscreen.value = !!document.fullscreenElement;
}

function handleManageAccount(): void {
    router.replace({ query: { ...route.query, dlg: 'account' } });
    emit('continue');
}

function handleReloadApp(): void {
    location.reload();
}

async function handleSetAppearance(mode: 'dark' | 'light' | 'auto'): Promise<void> {
    const isPrefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = mode === 'dark' || (mode === 'auto' && isPrefersDark);
    localStorage.setItem(APPEARANCE_KEY, mode);
    currentAppearance.value = mode;
    document.documentElement.classList.toggle('dark', isDark);
    await nextTick();
    emit('continue');
}

function handleSetLanguage(id: LocaleId): void {
    localeId.value = id;
    emit('continue');
}

function handleSignInRegister(): void {
    router.replace({ query: { ...route.query, dlg: 'auth' } });
    emit('continue');
}

async function handleSignOut(): Promise<void> {
    await signOut();
    emit('continue');
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
        class="flex max-w-sm min-w-xs flex-col overflow-hidden border-separator bg-surface shadow-md"
        :class="
            viewportIsWide
                ? 'fixed bottom-[calc(var(--safe-bottom-offset)+2.5rem+0.5rem)] left-3 max-h-[calc(100vh-var(--safe-bottom-offset)-2.5rem-0.5rem-1rem)] rounded-md border border-red-500'
                : 'fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[80dvh] rounded-t-2xl border-x border-t'
        "
    >
        <div class="flex items-center justify-between border-b border-b-boundary bg-card px-4 pt-3 pb-2">
            <span class="text-lg">Session</span>
            <CloseButton @click="emit('continue')" />
        </div>

        <ScrollAreaFit class="flex-1">
            <div class="flex flex-col px-4 pt-2 pb-6">
                <!-- Display -->
                <div class="mt-1 flex gap-x-6">
                    <div class="flex flex-1 flex-col">
                        <div class="flex flex-col">
                            <!-- <div class="border-boundary h-px flex-1 border-t" /> -->
                            <div class="text-sm font-semibold text-muted">{{ t(T, 'Appearance') }}</div>
                            <!-- <div class="border-boundary h-px flex-1 border-t" /> -->
                            <Separator class="mt-1 mb-2.25 flex-none" />
                        </div>
                        <div class="flex gap-x-2">
                            <Button
                                class="flex flex-1 flex-col items-center text-xs"
                                :is-active="currentAppearance === 'auto'"
                                shape="icon"
                                size="sm"
                                @click="handleSetAppearance('auto')"
                            >
                                <MonitorIcon class="size-4.5!" />{{ t(T, 'System') }}
                            </Button>

                            <Button
                                class="flex flex-1 flex-col items-center text-xs"
                                :is-active="currentAppearance === 'light'"
                                shape="icon"
                                size="sm"
                                @click="handleSetAppearance('light')"
                            >
                                <SunIcon class="size-4.5!" />{{ t(T, 'Light') }}
                            </Button>

                            <Button
                                class="flex flex-1 flex-col items-center text-xs"
                                :is-active="currentAppearance === 'dark'"
                                shape="icon"
                                size="sm"
                                @click="handleSetAppearance('dark')"
                            >
                                <MoonIcon class="size-4.5!" />{{ t(T, 'Dark') }}
                            </Button>
                        </div>
                    </div>

                    <div v-if="isFullScreenSupported" class="flex flex-none flex-col">
                        <div class="text-sm font-semibold text-muted">{{ t(T, 'Full_screen') }}</div>
                        <Separator class="mt-1 mb-2.25 flex-none" />
                        <Button class="flex flex-col items-center text-xs" shape="icon" size="sm" @click="handleToggleWindowExpansion">
                            <ShrinkIcon v-if="screenIsFullscreen" class="size-4.5!" />
                            <ExpandIcon v-else class="size-4.5!" />
                            {{ screenIsFullscreen ? t(T, 'Collapse') : t(T, 'Expand') }}
                        </Button>
                    </div>
                </div>

                <!-- Languages -->
                <div class="mt-4 text-sm font-semibold text-muted">{{ t(T, 'Language') }}</div>
                <Separator class="mt-1 mb-1.25" />
                <ListItemButton
                    v-for="lang in SUPPORTED_LANGUAGES"
                    :key="lang.id"
                    class="mt-1 flex w-full flex-none items-center gap-x-2 text-sm"
                    :is-active="localeId === lang.id"
                    @click="handleSetLanguage(lang.id)"
                >
                    <!-- See https://github.com/lipis/flag-icons. -->
                    <img :src="`/flags/${lang.flag}.svg`" class="h-4 w-5.5 object-fill ring-1 ring-black/10 dark:ring-white/10" :alt="lang.label" />
                    <div>{{ lang.label }}</div>
                </ListItemButton>

                <Separator class="mt-4 mb-2" />

                <!-- Expiry Timer -->
                <!-- <template v-if="sessionIsAuthenticated">
                    <div class="text-muted text-xs">Expires in {{ formattedExpiresIn }}</div>
                    <div class="mb-1 flex h-1.5 w-full flex-none overflow-hidden rounded-full">
                        <div class="bg-green-500 transition-[width] duration-1000 ease-linear" :style="{ width: `${100 - elapsed}%` }" />
                        <div class="bg-amber-500 transition-[width] duration-1000 ease-linear" :style="{ width: `${elapsed}%` }" />
                    </div>
                </template> -->

                <!-- Manage Account -->
                <Button v-if="sessionIsAuthenticated" class="mt-2 min-w-50 justify-start" @click="handleManageAccount">{{ t(T, 'Manage_account') }}</Button>

                <!-- Reload -->
                <Button v-if="isPWA" class="mt-2 min-w-50 justify-start" variant="guarded" @click="handleReloadApp">{{ t(T, 'Reload') }}</Button>

                <!-- Sign In / Sign Out -->
                <Button v-if="sessionIsAuthenticated" class="mt-2 min-w-50 justify-start" variant="guarded" @click="handleSignOut">{{ t(T, 'Sign_out') }}</Button>
                <Button v-else class="mt-2 min-w-50 justify-start" variant="primary" @click="handleSignInRegister">{{ t(T, 'Sign_in/Register') }}</Button>
            </div>
        </ScrollAreaFit>
    </div>
</template>
