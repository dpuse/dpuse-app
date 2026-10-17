<script setup lang="ts">
// Shows the content only once its data has arrived: a busy bar until then, or the failure if retrieval failed. The
// failure offers no Retry, because the configuration reconnects by itself and the other retrievals cannot be retried.
// A wait that runs long says so and offers a reload, so the user is never left watching a busy bar with no way out.

// ── External Dependencies & Registrations
import { useTimeoutFn } from '@vueuse/core';
import { ref, watch } from 'vue';

// ── Local Framework
import type { RetrievalStatus } from '@/state/configs';
import { t } from '@/state/locale';
import { TEXT } from './RetrievalGate_.json';

// ── Static Components
import BusyBar from '@/components/ui/BusyBar.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SLOW_RETRIEVAL_MS = 2000; // The same wait as the data view list's slow-load message, so the two read as one.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Attributes go to the failure only. The content can be several elements, and the busy bar keeps its own size.
defineOptions({ inheritAttrs: false });
const { status } = defineProps<{ status: RetrievalStatus }>();
defineSlots<{ default: () => unknown }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const retrievalIsSlow = ref(false);
const { start: startSlowRetrievalTimer, stop: stopSlowRetrievalTimer } = useTimeoutFn(
    () => {
        retrievalIsSlow.value = true;
    },
    SLOW_RETRIEVAL_MS,
    { immediate: false }
);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Each wait starts its own timer, so one that ends quickly never shows the message.
watch(
    () => status.typeId === 'pending',
    (isPending) => {
        retrievalIsSlow.value = false;
        if (isPending) startSlowRetrievalTimer();
        else stopSlowRetrievalTimer();
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Nothing here can be retried on its own, as with a failure, so the way out is a fresh start.
function handleReloadApp(): void {
    location.reload();
}
</script>

<template>
    <div v-if="status.typeId === 'pending'">
        <BusyBar class="mx-4" />

        <!-- Slow Retrieval ─ Below the bar, so the bar does not move when it appears. -->
        <div v-if="retrievalIsSlow" class="mx-4 mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
            <p class="text-sm text-muted" role="status">{{ t(TEXT, 'retrieval.slow.text') }}</p>
            <RectangleButton @click="handleReloadApp">{{ t(TEXT, 'reload.label') }}</RectangleButton>
        </div>
    </div>
    <ErrorNotice v-else-if="status.typeId === 'failed'" v-bind="$attrs" :can-retry="false" :failures="[status.failure]" />
    <slot v-else />
</template>
