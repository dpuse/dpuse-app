<script setup lang="ts">
// ── External Dependencies & Registrations
import { RefreshCwIcon } from '@lucide/vue';
import { useRoute } from 'vue-router';
import { computed, ref, watch } from 'vue';
import { useConfirmDialog, useTimeoutFn } from '@vueuse/core';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './NewVersionNotice_.json';
import { moduleUpdateIsAvailable, newAppVersionIsAvailable, updateAnnouncementCount } from '@/state/appVersion';
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

// Chosen from what is pending, not from what arrived last, so the order the updates came in makes no difference.
const messageText = computed(() => {
    if (!newAppVersionIsAvailable.value) return t(TEXT, 'moduleUpdate.text');
    return t(TEXT, moduleUpdateIsAvailable.value ? 'newVersionAndModuleUpdate.text' : 'newVersion.text');
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// A dismissed notice comes back early when the user moves to another screen, a natural pause, or when a newer update
// arrives that they have not yet been told about.
watch([(): string => route.path, updateAnnouncementCount], () => {
    isDismissed.value = false;
    stopDismissTimer();
});

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
    <!-- Notice ─ On a narrow screen the message takes the full width, with the close button in its top corner and Reload
         on a line of its own below. From 'sm' up all three sit in one row. -->
    <div
        v-if="!isDismissed"
        class="fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(var(--safe-bottom-offset)+2.5rem+0.75rem)] left-[calc(1rem+env(safe-area-inset-left))] z-40 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 rounded-lg border border-separator bg-surface py-2 pr-2 pl-4 text-sm text-content shadow-lg sm:left-auto sm:flex sm:max-w-[calc(100%-2rem)]"
        data-region="NewVersionNotice"
        role="status"
    >
        <p>{{ messageText }}</p>
        <RectangleButton class="col-span-2 row-start-2 flex shrink-0 items-center justify-self-end" variant="primary" @click="handleReload">
            <RefreshCwIcon class="mr-1.5 size-4" />
            {{ t(TEXT, 'reload.label') }}
        </RectangleButton>
        <CloseButton class="col-start-2 row-start-1 self-start sm:self-auto" :accessible-label="t(TEXT, 'dismiss.aria')" @click="handleDismiss" />
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
