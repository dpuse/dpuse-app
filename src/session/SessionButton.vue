<script setup lang="ts">
// ── External Dependencies & Registrations
import { LoaderCircleIcon } from '@lucide/vue';
import { type ComponentPublicInstance, computed, defineAsyncComponent, onUnmounted, ref, useTemplateRef } from 'vue';

// ── Local Framework
import { load } from '@/state/component';
import { expiresIn, lifetime, sessionIsAuthenticated } from '@/state/session';
import { sessionMenuIsOpen, viewportIsWide } from '@/state/appLayout';

// ── Local Components - Static
import AvatarButton from '@/components/ui/button/AvatarButton.vue';

// ── Local Components - Dynamic
const SessionMenu = defineAsyncComponent(load('SessionMenu', () => import('@/session/SessionMenu.vue')));

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { studioOptionBarIsVisible } = defineProps<{ studioOptionBarIsVisible: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ??? Avatar ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const avatarUrl = ref('');
const emailAddress = 'terrell.jm@gmail.com';
const error = ref(false);

const RING_CIRCUMFERENCE = 2 * Math.PI * 18; // r=18 on 40×40 viewBox
const elapsed = computed(() => {
    if (lifetime.value == null || lifetime.value === 0) return 0;
    return ((lifetime.value - (expiresIn.value ?? 0)) / lifetime.value) * 100;
});

const initials = computed(() => {
    const local = emailAddress.split('@', 1)[0] ?? '';
    const parts = local.split(/[._-]/);
    return (parts[1] == null ? '?' : (parts[0]!.charAt(0) + parts[1].charAt(0)).toUpperCase()) ?? local.slice(0, 2).toUpperCase();
});

async function gravatarUrl(email: string, size: number): Promise<string> {
    const normalized = email.trim().toLowerCase();

    const data = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hashArray = [...new Uint8Array(hashBuffer)];
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return `https://gravatar.com/avatar/${hashHex}?s=${size}&d=404`;
}

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

const sessionMenuReference = useTemplateRef<ComponentPublicInstance>('sessionMenuReference');
const handleDocumentPointerDown = (event: PointerEvent): void => {
    if (!sessionMenuIsOpen.value) return;
    const target = event.target as Element;
    if ((sessionMenuReference.value?.$el as Element | undefined)?.contains(target) === true) return;
    if (target.closest('.dpuse-outside-click-ignore')) return;
    handleClose();
};
document.addEventListener('pointerdown', handleDocumentPointerDown, { capture: true });
onUnmounted(() => document.removeEventListener('pointerdown', handleDocumentPointerDown, { capture: true }));

function handleClose(): void {
    sessionMenuIsOpen.value = false;
}

function onMenuAfterLeave(): void {}
</script>

<template>
    <div class="flex flex-col">
        <Teleport to="body">
            <Transition :name="viewportIsWide ? 'dpuse-slide-up' : 'dpuse-sheet'" @after-leave="onMenuAfterLeave">
                <SessionMenu v-if="sessionMenuIsOpen" ref="sessionMenuReference" class="z-51" @continue="handleClose" />
            </Transition>
        </Teleport>

        <AvatarButton
            aria-label="Toggle session panel"
            class="dpuse-outside-click-ignore relative size-10"
            :class="{ 'bg-surface shadow-md': !viewportIsWide && !studioOptionBarIsVisible }"
            @click="sessionMenuIsOpen = !sessionMenuIsOpen"
        >
            <Transition name="fade">
                <!-- Session is authenticated. Show photo or initials. -->
                <div v-if="sessionIsAuthenticated === true" class="absolute inset-0 flex items-center justify-center">
                    <img v-if="!error" alt="" class="size-9.5 rounded-full" :src="avatarUrl" @error="error = true" />
                    <div v-else class="rounded-full text-xl">{{ initials }}</div>
                </div>

                <!-- Session is NOT authenticated. Show user silhouette. -->
                <div v-else-if="sessionIsAuthenticated === false" class="absolute inset-0 flex items-center justify-center rounded-full bg-surface">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="size-8 text-content">
                        <path
                            fill-rule="evenodd"
                            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>

                <!-- Session authentication is pending. Show waiting icon. -->
                <div v-else class="absolute inset-0 flex items-center justify-center rounded-full bg-surface">
                    <LoaderCircleIcon key="loader" class="size-5 animate-spin text-neutral-300" />
                </div>
            </Transition>

            <!-- Circular session-time ring: amber = elapsed (background), green = remaining (foreground) -->
            <!-- <svg v-if="sessionIsAuthenticated === true" class="pointer-events-none absolute inset-0 size-full -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
                <! -- Amber background ring — always full, reveals as green retreats -- >
                <circle cx="20" cy="20" r="18" fill="none" class="stroke-amber-500" stroke-width="3" />
                <! -- Green foreground — remaining time, starts at 12 o'clock, shrinks from tail -- >
                <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    class="stroke-green-500"
                    stroke-width="3"
                    stroke-linecap="round"
                    :stroke-dasharray="RING_CIRCUMFERENCE"
                    :stroke-dashoffset="(RING_CIRCUMFERENCE * elapsed) / 100"
                    style="transition: stroke-dashoffset 1s linear"
                />
            </svg> -->
        </AvatarButton>
    </div>
</template>

<style scoped>
.fade-enter-active {
    transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1) 0.25s;
    will-change: opacity;
}
.fade-leave-active {
    transition: opacity 0.5s cubic-bezier(0.4, 0, 1, 1);
    will-change: opacity;
}
@media (prefers-reduced-motion: reduce) {
    .fade-enter-active,
    .fade-leave-active {
        transition: none;
    }
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Desktop popover */
.dpuse-slide-up-enter-active,
.dpuse-slide-up-leave-active {
    transform-origin: bottom;
    will-change: transform, opacity;
    transition:
        transform 0.2s ease,
        opacity 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
    .dpuse-slide-up-enter-active,
    .dpuse-slide-up-leave-active {
        transition: none;
    }
}
.dpuse-slide-up-enter-from,
.dpuse-slide-up-leave-to {
    transform: scaleY(0.75) translateY(6px);
    opacity: 0;
}
.dpuse-slide-up-enter-to,
.dpuse-slide-up-leave-from {
    transform: scaleY(1);
    opacity: 1;
}

/* Mobile bottom sheet */
.dpuse-sheet-enter-active,
.dpuse-sheet-leave-active {
    will-change: transform, opacity;
    transition:
        transform 0.3s cubic-bezier(0.32, 0.72, 0, 1),
        opacity 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
    .dpuse-sheet-enter-active,
    .dpuse-sheet-leave-active {
        transition: none;
    }
}
.dpuse-sheet-enter-from,
.dpuse-sheet-leave-to {
    transform: translateY(100%);
    opacity: 0;
}
.dpuse-sheet-enter-to,
.dpuse-sheet-leave-from {
    transform: translateY(0);
    opacity: 1;
}
</style>
