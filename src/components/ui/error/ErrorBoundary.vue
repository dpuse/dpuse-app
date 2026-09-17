<script setup lang="ts">
// ── External Dependencies & Registrations
import { nextTick, onErrorCaptured, ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { type AppFailure, isComponentLoaderErrorInfo, raiseFailure } from '@/state/errors';

// ── Static Components
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Wraps a region so a failure inside it costs only that region. 'name' identifies the region in the reported error;
// it is not shown to the user, whose message comes from the error itself.
const { name, resetKey } = defineProps<{
    name: string;
    resetKey?: unknown; // A change clears the error, e.g. the route's full path, so it clears on navigation.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const capturedFailure = shallowRef<AppFailure | undefined>();
const slotIsMounted = ref(true); // Cleared for one tick on retry, which is what forces the slot to remount.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Every failure caught here is displayed here, including a chunk this deployment can no longer fetch: the region is
// where the loss actually happened, and the display offers a reload alongside the retry for the cases where retrying
// cannot work. Always returns false: whether this boundary displays the failure or leaves it to the panel that owns
// it, it is handled below this point and the global handler must not treat it as an uncaught error as well.
onErrorCaptured((error, _instance, info) => {
    // A lazy panel that failed to load is already being shown in its own place, by name, by its own
    // 'LoadFailureNotice'. Claiming it here would replace this whole region with a vaguer message for a failure
    // that costs only the panel.
    if (!isComponentLoaderErrorInfo(info)) {
        const data = { region: name, typeId: 'componentRender' };
        capturedFailure.value = raiseFailure(new AppError(`Failed to render ${name}.`, `dpuse.errorBoundary.${name}`, data, { cause: error }));
    }
    return false;
});

// An error belongs to the view that produced it; moving on should not leave it stranded over the new one.
watch(
    () => resetKey,
    () => {
        if (capturedFailure.value) void handleRetry();
    }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleRetry(): Promise<void> {
    capturedFailure.value = undefined;
    slotIsMounted.value = false;
    await nextTick();
    slotIsMounted.value = true;
}
</script>

<template>
    <!-- 'display: contents' keeps this a single-root component, so attributes still fall through, without adding a box
         that would disturb the layout of whatever it wraps. It suits the covering display too: with no box of its own,
         that display becomes a child of whatever laid the slot out and takes the space the slot would have had. -->
    <div class="contents" data-region="ErrorBoundary">
        <ErrorNotice v-if="capturedFailure" covers-region :failures="[capturedFailure]" @retry="handleRetry" />
        <slot v-else-if="slotIsMounted" />
    </div>
</template>
