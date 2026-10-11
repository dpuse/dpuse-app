<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref } from 'vue';
import { RefreshCwIcon } from '@lucide/vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './NewVersionNotice_.json';

// ── Static Components
import CloseButton from '@/components/ui/action/CloseButton.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Dismissing only hides the notice. The next move to another screen still loads the new version.
const isDismissed = ref(false);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleReload(): void {
    location.reload();
}
</script>

<template>
    <div
        v-if="!isDismissed"
        class="fixed right-[calc(1rem+env(safe-area-inset-right))] bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-lg border border-separator bg-surface py-2 pr-2 pl-4 text-sm text-content shadow-lg"
        data-region="NewVersionNotice"
        role="status"
    >
        <p>{{ t(TEXT, 'newVersion.text') }}</p>
        <RectangleButton class="flex shrink-0 items-center" variant="primary" @click="handleReload">
            <RefreshCwIcon class="mr-1.5 size-4" />
            {{ t(TEXT, 'reload.label') }}
        </RectangleButton>
        <CloseButton :accessible-label="t(TEXT, 'dismiss.aria')" @click="isDismissed = true" />
    </div>
</template>
