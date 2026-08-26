<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { nextTick, onErrorCaptured, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';
import { classifyError, raiseFatalError, raiseStaleDeployFailure } from '@/state/errors';

// ── Static Components
import ErrorDisplay from '@/components/ui/error/ErrorDisplay.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Wraps a region so a failure inside it costs only that region. 'name' identifies the region in the reported error;
// it is not shown to the user, whose message comes from the error itself.
const { name } = defineProps<{ name: string }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const capturedError = shallowRef<AppError | undefined>();
const capturedErrorWasReported = ref<boolean | undefined>(); // Undefined while the report is in flight.
const route = useRoute();
const slotIsMounted = ref(true); // Cleared for one tick on retry, which is what forces the slot to remount.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onErrorCaptured((error) => {
    void captureError(error);
    return false; // Handled here, so the global handler must not also treat it as an uncaught error.
});

// An error belongs to the view that produced it; navigating away should not leave it stranded over the new one.
watch(
    () => route.fullPath,
    () => {
        if (capturedError.value) void handleRetry();
    }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleRetry(): Promise<void> {
    capturedError.value = undefined;
    capturedErrorWasReported.value = undefined;
    slotIsMounted.value = false;
    await nextTick();
    slotIsMounted.value = true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function captureError(error: unknown): Promise<void> {
    const data = { region: name, typeId: 'componentRender' };
    const appError = new AppError(`Failed to render ${name}.`, `dpuse.errorBoundary.${name}`, data, { cause: error });

    switch (classifyError(error, 'recoverable')) {
        case 'staleDeploy':
            raiseStaleDeployFailure(appError); // The refresh banner owns it — nothing is rendered in place.
            return;
        case 'fatal':
            await raiseFatalError(appError);
            return;
        default:
            capturedError.value = appError;
            capturedErrorWasReported.value = await reportAppError(appError);
    }
}
</script>

<template>
    <!-- 'display: contents' keeps this a single-root component, so attributes still fall through, without adding a box
         that would disturb the layout of whatever it wraps. -->
    <div class="contents" data-region="ErrorBoundary">
        <ErrorDisplay v-if="capturedError" :error="capturedError" :error-was-reported="capturedErrorWasReported" @retry="handleRetry" />
        <slot v-else-if="slotIsMounted" />
    </div>
</template>
