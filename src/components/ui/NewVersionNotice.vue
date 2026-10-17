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
    <!-- Notice ─ 'Later' sits to the left of Reload, as Cancel does in the app's dialogs. On a narrow screen the message
         takes the full width with the buttons on a line below it. From 'sm' up everything sits in one row. Placed by
         the notice stack in 'App.vue', which lets clicks through, so the notice takes them back. -->
    <div
        v-if="!isDismissed"
        class="pointer-events-auto flex flex-col gap-3 rounded-lg border border-separator bg-surface p-4 text-sm text-content shadow-lg sm:flex-row sm:items-center sm:py-2 sm:pr-2"
        data-region="NewVersionNotice"
        role="status"
    >
        <p>{{ messageText }}</p>
        <div class="flex shrink-0 justify-end gap-2">
            <RectangleButton @click="handleDismiss">{{ t(TEXT, 'later.label') }}</RectangleButton>
            <RectangleButton class="flex items-center" variant="primary" @click="handleReload">
                <RefreshCwIcon class="mr-1.5 size-4" />
                {{ t(TEXT, 'reload.label') }}
            </RectangleButton>
        </div>
    </div>

    <!-- Takes clicks back from the notice stack in 'App.vue'. The dialog shows in the browser's top layer, but still
         inherits 'pointer-events' from the stack. -->
    <ConfirmDialog
        class="pointer-events-auto"
        :confirm-label="t(TEXT, 'reload.label')"
        :is-open="reloadConfirmIsOpen"
        :message="t(TEXT, 'reloadConfirm.text')"
        :title="t(TEXT, 'reloadConfirm.title')"
        @cancel="cancelReload"
        @confirm="confirmReload"
    />
</template>
