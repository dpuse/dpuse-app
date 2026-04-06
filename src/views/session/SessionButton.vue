<script setup lang="ts">
// External Dependencies
import { LoaderCircleIcon } from 'lucide-vue-next';
import { type ComponentPublicInstance, computed, onMounted, onUnmounted, ref } from 'vue';

// App Core
import { useDisplayBreakpoint } from '~/src/state/useDisplayBreakpoint';
import { useSession } from '~/src/state/useSession';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import Mask from '@/components/mask/Mask.vue';
import SessionMenu from '@/views/session/SessionMenu.vue';

// Properties & Emits
const { workbenchOptionBarIsVisible } = defineProps<{ workbenchOptionBarIsVisible: boolean }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { displayIsWide } = useDisplayBreakpoint();
const { isAuthenticated: sessionIsAuthenticated } = useSession();

// Reactive State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessionMenuIsVisible = ref(false);

// ??? Avatar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const avatarUrl = ref('');
const emailAddress = 'terrell.jm@gmail.com';
const error = ref(false);

const initials = computed(() => {
    const local = emailAddress.split('@')[0] ?? '';
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

// Lifecycle Event Handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => {
    gravatarUrl(emailAddress, 38)
        .then((response) => (avatarUrl.value = response))
        .catch((error) => console.log(error));
});

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const sessionMenuReference = ref<ComponentPublicInstance | null>(null);
const handleDocumentPointerDown = (event: PointerEvent): void => {
    if (!sessionMenuIsVisible.value) return;
    const target = event.target as Element;
    if ((sessionMenuReference.value?.$el as Element | undefined)?.contains(target) === true) return;
    if (target.closest('.dpuse-outside-click-ignore')) return;
    handleClose();
};
document.addEventListener('pointerdown', handleDocumentPointerDown, { capture: true });
onUnmounted(() => document.removeEventListener('pointerdown', handleDocumentPointerDown, { capture: true }));

function handleClose(): void {
    sessionMenuIsVisible.value = false;
}

function onMenuAfterLeave(): void {}
</script>

<template>
    <div class="flex flex-col">
        <Transition name="dpuse-mask">
            <Mask v-if="sessionMenuIsVisible && !displayIsWide" class="z-40" />
        </Transition>

        <Transition :name="displayIsWide ? 'dpuse-slide-up' : 'dpuse-sheet'" @after-leave="onMenuAfterLeave">
            <SessionMenu
                v-if="sessionMenuIsVisible"
                ref="sessionMenuReference"
                :class="
                    displayIsWide
                        ? 'fixed bottom-19.25 left-3 max-h-[calc(100vh-5.8125rem)] overflow-y-auto overscroll-y-none'
                        : 'fixed right-0 bottom-0 left-0 z-50 max-h-[80vh] overflow-y-auto overscroll-y-none rounded-t-2xl'
                "
                :sheet="!displayIsWide"
                @continue="handleClose"
            />
        </Transition>

        <Button class="dpuse-outside-click-ignore relative h-10 w-10" :class="{ 'shadow-md': !displayIsWide && !workbenchOptionBarIsVisible }" variant="avatar">
            <Transition name="fade">
                <!-- Session is authenticated. Show photo or initials. -->
                <div v-if="sessionIsAuthenticated === true" class="absolute inset-0 flex items-center justify-center" @click="sessionMenuIsVisible = !sessionMenuIsVisible">
                    <img v-if="!error" class="size-9.5 rounded-full" :src="avatarUrl" @error="error = true" />
                    <div v-else class="rounded-full text-xl">{{ initials }}</div>
                </div>

                <!-- Session is NOT authenticated. Show user silhouette. -->
                <div
                    v-else-if="sessionIsAuthenticated === false"
                    class="bg-surface absolute inset-0 flex items-center justify-center rounded-full"
                    @click="sessionMenuIsVisible = !sessionMenuIsVisible"
                >
                    <svg viewBox="0 0 24 24" fill="currentColor" class="size-8 text-zinc-400/60">
                        <path
                            fill-rule="evenodd"
                            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>

                <!-- Session authentication is pending. Show waiting icon. -->
                <div v-else class="bg-surface absolute inset-0 flex items-center justify-center rounded-full">
                    <LoaderCircleIcon key="loader" class="size-5 animate-spin text-neutral-300" />
                </div>
            </Transition>
        </Button>
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

/* Mask fade */
.dpuse-mask-enter-active,
.dpuse-mask-leave-active {
    transition: opacity 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
    .dpuse-mask-enter-active,
    .dpuse-mask-leave-active {
        transition: none;
    }
}
.dpuse-mask-enter-from,
.dpuse-mask-leave-to {
    opacity: 0;
}
</style>
