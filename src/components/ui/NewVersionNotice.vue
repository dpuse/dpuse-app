<script setup lang="ts">
// ── External Dependencies & Registrations
import { RefreshCwIcon } from '@lucide/vue';
import { useRoute } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { useConfirmDialog, useTimeoutFn } from '@vueuse/core';

// ── Local Framework
import { newAppVersionIsAvailable } from '@/state/appVersion';
import { t } from '@/state/locale';
import { TEXT } from './NewVersionNotice_.json';
import { reloadWithConfirmedLoss, unsavedWorkIsPresent } from '@/state/unsavedWork';

// ── Static Components
import CloseButton from '@/components/ui/action/CloseButton.vue';
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DISMISS_DURATION_MS = 60 * 60 * 1000; // A dismissed notice returns after an hour, so nobody stays on old code for good.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Route
const route = useRoute();

// ── Dismissal ─ Dismissing hides the notice for an hour, or until the user moves to another screen. For a new app
// version, that move also loads it.
const isDismissed = ref(false);
const { start: startDismissTimer, stop: stopDismissTimer } = useTimeoutFn(
    () => {
        isDismissed.value = false;
    },
    DISMISS_DURATION_MS,
    { immediate: false }
);

// ── Reload Confirmation
const { cancel: cancelReload, confirm: confirmReload, isRevealed: reloadConfirmIsOpen, reveal: revealReloadConfirm } = useConfirmDialog();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// A new app version takes priority, because its reload picks up any module changes as well.
const messageText = computed(() => t(TEXT, newAppVersionIsAvailable.value ? 'newVersion.text' : 'moduleUpdate.text'));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Moving to another screen is a natural pause, so a dismissed notice comes back then rather than waiting out the hour.
watch(
    () => route.path,
    () => {
        isDismissed.value = false;
        stopDismissTimer();
    }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Asks first when a screen has unsaved work, in words the browser's own leave-page warning cannot use. Cancelling
// leaves the notice in place, so the user can save and reload later.
async function handleReload(): Promise<void> {
    if (unsavedWorkIsPresent.value) {
        const { isCanceled } = await revealReloadConfirm();
        if (isCanceled) return;
    }
    reloadWithConfirmedLoss();
}

function handleDismiss(): void {
    isDismissed.value = true;
    startDismissTimer();
}
</script>

<template>
    <div
        v-if="!isDismissed"
        class="fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-lg border border-separator bg-surface py-2 pr-2 pl-4 text-sm text-content shadow-lg"
        data-region="NewVersionNotice"
        role="status"
    >
        <p>{{ messageText }}</p>
        <RectangleButton class="flex shrink-0 items-center" variant="primary" @click="handleReload">
            <RefreshCwIcon class="mr-1.5 size-4" />
            {{ t(TEXT, 'reload.label') }}
        </RectangleButton>
        <CloseButton :accessible-label="t(TEXT, 'dismiss.aria')" @click="handleDismiss" />
    </div>

    <ConfirmDialog
        :confirm-label="t(TEXT, 'reload.label')"
        :is-open="reloadConfirmIsOpen"
        :message="t(TEXT, 'reloadConfirm.text')"
        :title="t(TEXT, 'reloadConfirm.title')"
        @cancel="cancelReload"
        @confirm="confirmReload"
    />
</template>
