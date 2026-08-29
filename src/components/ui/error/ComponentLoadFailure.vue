<script setup lang="ts">
// ── External Dependencies & Registrations
import { shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Static Components
import ErrorDisplay from '@/components/ui/error/ErrorDisplay.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Shown in place of a component that failed to load. The prop names match what 'defineAsyncComponent' passes to its
// 'errorComponent', so it can be used there directly; 'name' is supplied by the caller through an extending component.
// 'retry' is optional only because the props mirror that contract — every load now arrives through 'defineAsyncPanel',
// which always supplies it. The reload fallback stands as a backstop if this is ever rendered by hand.
const { error, name, retry } = defineProps<{ error: unknown; name?: string; retry?: () => void }>();

// 'defineAsyncComponent' also passes 'fail' and 'attempts', which are not used here. Without this they would land on
// the root as attributes, and there is no root element to receive them until a failure has been captured.
defineOptions({ inheritAttrs: false });

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const loadFailure = shallowRef<AppFailure | undefined>();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Watched rather than run once: a failed retry re-renders this component with a new error rather than remounting it.
// A chunk this deployment can no longer fetch is displayed here like any other failure — this is the space the missing
// component would have occupied, so it is where its absence is worth explaining, and 'ErrorDisplay' offers the refresh
// that is the only thing which can actually fix it.
watch(
    () => error,
    (newError) => {
        const data = { componentName: name ?? 'Unknown', typeId: 'componentLoad' };
        loadFailure.value = raiseFailure(new AppError(`Failed to load the ${name ?? 'unknown'} component.`, 'dpuse.componentLoadFailure', data, { cause: newError }));
    },
    { immediate: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetry(): void {
    if (retry) {
        retry();
        return;
    }
    location.reload();
}
</script>

<template>
    <!-- Covers the region: this stands in for a panel that never arrived, so the space it would have occupied is
         exactly what has failed. -->
    <ErrorDisplay v-if="loadFailure" covers-region :failure="loadFailure" @retry="handleRetry" />
</template>
