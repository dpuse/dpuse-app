<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { ExpandIcon, MonitorIcon, MoonIcon, ShrinkIcon, SunIcon } from '@lucide/vue';

// ── DPUse Framework
import { formatNumberAsDuration } from '@dpuse/dpuse-shared/utilities';
import { type LocaleId, SUPPORTED_LANGUAGES } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { useDialogs } from '@/state/dialogs';
import { expiresIn, lifetime, sessionIsAuthenticated, setSessionExpiryTimer, signOut } from '@/state/session';
import { isPWA, viewportIsWide } from '@/state/appLayout';
import { localeId, t } from '@/state/locale';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import CloseButton from '@/components/ui/button/CloseButton.vue';
import ListItemButton from '@/components/ui/button/ListItemButton.vue';
import ScrollAreaFit from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const APPEARANCE_KEY = 'dpuse-appearance';

const T = {
    Appearance: { en: 'Appearance', es: 'Apariencia' },
    Collapse: { en: 'Collapse', es: 'Contraer' },
    Dark: { en: 'Dark', es: 'Oscura' },
    Display: { en: 'Display', es: 'Pantalla' },
    Expand: { en: 'Expand', es: 'Expandir' },
    Full_screen: { en: 'Screen', es: 'Pantalla' },
    Language: { en: 'Language', es: 'Idioma' },
    Light: { en: 'Light', es: 'Clara' },
    Manage_account: { en: 'Manage account', es: 'Administrar cuenta' },
    Reload: { en: 'Reload', es: 'Recargar' },
    'Sign_in/Register': { en: 'Sign in / Register', es: 'Iniciar sesión / Registrarse' },
    Sign_out: { en: 'Sign out', es: 'Desconectar' },
    System: { en: 'System', es: 'Sistema' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ continue: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const currentAppearance = ref(localStorage.getItem(APPEARANCE_KEY) ?? 'auto');
const dialogElement = useTemplateRef<HTMLDialogElement>('dialogReference');
const isFullScreenSupported = document.fullscreenEnabled;
const screenIsFullscreen = ref(!!document.fullscreenElement);
const { openDialog } = useDialogs();

const elapsed = computed(() => {
    if (lifetime.value == null || lifetime.value === 0) return 0;
    return ((lifetime.value - (expiresIn.value ?? 0)) / lifetime.value) * 100;
});

const formattedExpiresIn = computed(() => formatNumberAsDuration(expiresIn.value, 'secs'));

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

setSessionExpiryTimer(true);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// The menu is mounted only while open, so it opens itself. 'showModal' is what promotes it to the top layer, and with
// it comes the scrim (its own '::backdrop'), Escape, focus containment, focus returned to the avatar button, and the
// rest of the document marked inert — none of which is reimplemented here.
onMounted(() => {
    dialogElement.value?.showModal();
    // Bound here rather than in the template because a click on the backdrop reports the dialog itself as its target,
    // and the accessibility lint reads a click handler on a 'dialog' as one put on a static element. Dismissal by
    // pointer belongs beside dismissal by Escape in any case.
    dialogElement.value?.addEventListener('click', handleClick);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
    setSessionExpiryTimer();
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Escape is stopped from closing the element itself: the parent owns whether the menu exists, and letting the browser
// close it would leave the node mounted but hidden, with no leave animation and nothing to reopen it.
function handleCancel(event: Event): void {
    event.preventDefault();
    emit('continue');
}

// Only a click that lands on the dialog itself is a backdrop click: anything inside the menu reports that child as the
// target. The avatar button is covered by the backdrop while the menu is open, so clicking it arrives here and closes.
function handleClick(event: MouseEvent): void {
    if (event.target !== dialogElement.value) return;
    emit('continue');
}

function handleFullscreenChange(): void {
    screenIsFullscreen.value = !!document.fullscreenElement;
}

async function handleManageAccount(): Promise<void> {
    await openDialog('account'); // Awaited so the menu closes only once the URL carries the dialog.
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

async function handleSignInRegister(): Promise<void> {
    await openDialog('auth'); // Awaited so the menu closes only once the URL carries the dialog.
    emit('continue');
}

async function handleSignOut(): Promise<void> {
    await signOut();
    emit('continue');
}

async function handleToggleWindowExpansion(): Promise<void> {
    await toggleFullscreen();
    emit('continue');
}

async function toggleFullscreen(): Promise<void> {
    await (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
}
</script>
<template>
    <dialog
        ref="dialogReference"
        class="session-menu hidden size-auto max-w-sm min-w-xs flex-col overflow-hidden border-separator bg-surface p-0 text-content shadow-md open:flex"
        :class="
            viewportIsWide
                ? 'fixed top-auto right-auto bottom-[calc(var(--safe-bottom-offset)+2.5rem+0.5rem)] left-3 m-0 max-h-[calc(100vh-var(--safe-bottom-offset)-2.5rem-0.5rem-1rem)] rounded-md border border-boundary'
                : 'session-menu-dimmed fixed inset-x-0 top-auto bottom-0 mx-auto my-0 max-h-[80dvh] rounded-t-2xl border-x border-t border-b-0'
        "
        @cancel="handleCancel"
    >
        <!-- The class list is mostly a reply to the UA's dialog stylesheet.
             'hidden ... open:flex' rather than a bare 'flex': the UA hides a dialog that is not open, and any author
             'display' would defeat that and leave the menu on screen permanently.
             'top-auto'/'right-auto' undo the UA's 'inset: 0' on a modal dialog, which would otherwise stretch the menu
             to fill the viewport rather than sit where the offsets above put it.
             'size-auto' undoes the UA's 'fit-content' on both axes. They are not the same thing here: with 'top'
             auto, 'height: auto' already shrink-wraps, while WebKit sizing a 'fit-content' column flex container drops
             the body — 'flex-1' against a zero basis — to nothing and leaves the header alone on screen. Width matters
             for the same reason in reverse: the sheet spans 'inset-x-0' and is meant to fill that up to 'max-w-sm',
             which 'fit-content' would shrink to the content instead.
             'border-b-0' because the UA's 'border: solid' leaves a medium bottom border the old div never had.
             The comments stay inside the root: above it they would be sibling root nodes, making this multi-root and
             costing the transition classes the parent applies here. -->
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
    </dialog>
</template>

<style scoped>
/* The scrim. Wide, the menu is a small popover anchored to the avatar button and the backdrop only has to swallow the
   click that dismisses it, so it stays clear; narrow, the menu is a sheet over most of the screen, so it dims.
   The enter fade needs '@starting-style' because the backdrop has no state before the dialog is shown, and the leave
   fade is keyed off the transition classes the parent puts on this element, since the backdrop goes with the node. */
.session-menu::backdrop {
    background-color: transparent;
    transition: background-color 0.2s ease;
}

.session-menu.session-menu-dimmed::backdrop {
    background-color: var(--overlay);
}

@starting-style {
    .session-menu[open]::backdrop {
        background-color: transparent;
    }
}

.session-menu.dpuse-sheet-leave-active::backdrop,
.session-menu.dpuse-slide-up-leave-active::backdrop {
    background-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
    .session-menu::backdrop {
        transition: none;
    }
}
</style>
