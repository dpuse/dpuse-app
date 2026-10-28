<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, ref } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { hasReportedAppError } from '@/observability/errorTracking';
import { raiseAppFailure } from '@/state/errors';
import { t } from '@/state/locale';
import { TEXT } from './GuestWorkNotice_.json';
import { countGuestWorkspaceStoreRecords, moveGuestWorkspaceStoreRecords } from '@/services/workspaceStore';

// ── Static Components
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const noticeIsVisible = ref(false); // Shown only once the guest store is known to hold something worth moving.
const guestWorkIsMoving = ref(false);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(async () => {
    try {
        noticeIsVisible.value = (await countGuestWorkspaceStoreRecords()) > 0;
    } catch (error) {
        // Logged and reported, but not shown: the guest work is still in its own store, so nothing is lost and the user
        // has nothing to act on.
        void hasReportedAppError(new AppError('Failed to check for guest work.', 'dpuse-app.GuestWorkNotice', { typeId: 'handled' }, { cause: error }));
    }
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleKeepGuestWork(): void {
    noticeIsVisible.value = false;
}

async function handleMoveGuestWork(): Promise<void> {
    if (guestWorkIsMoving.value) return;

    guestWorkIsMoving.value = true;
    try {
        await moveGuestWorkspaceStoreRecords();
        noticeIsVisible.value = false;
    } catch (error) {
        // Left open, so the user can try again. Each record is copied before it is removed, so none is lost.
        raiseAppFailure(new AppError('Failed to move guest work into the account.', 'dpuse-app.GuestWorkNotice.handleMoveGuestWork', { typeId: 'handled' }, { cause: error }));
    } finally {
        guestWorkIsMoving.value = false;
    }
}
</script>

<template>
    <!-- Notice ─ A question, so it is answered with buttons rather than closed with an ✕. Keeping the work separate sits
         to the left of moving it, as Cancel does in the app's dialogs. Placed by the notice stack in 'App.vue', which
         lets clicks through, so the notice takes them back. -->
    <div
        v-if="noticeIsVisible"
        class="pointer-events-auto flex flex-col gap-3 rounded-lg border border-separator bg-surface p-4 text-sm text-content shadow-lg sm:flex-row sm:items-center sm:py-2 sm:pr-2"
        data-region="GuestWorkNotice"
        role="status"
    >
        <p>{{ t(TEXT, 'guestWork.text') }}</p>
        <div class="flex shrink-0 justify-end gap-2">
            <RectangleButton :disabled="guestWorkIsMoving" @click="handleKeepGuestWork">{{ t(TEXT, 'keep.label') }}</RectangleButton>
            <RectangleButton :disabled="guestWorkIsMoving" variant="primary" @click="handleMoveGuestWork">{{ t(TEXT, 'move.label') }}</RectangleButton>
        </div>
    </div>
</template>
