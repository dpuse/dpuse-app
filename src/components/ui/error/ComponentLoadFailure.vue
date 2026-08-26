<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref, shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';
import { classifyError, raiseStaleDeployFailure } from '@/state/errors';

// ── Static Components
import ErrorDisplay from '@/components/ui/error/ErrorDisplay.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Shown in place of a component that failed to load. The prop names match what 'defineAsyncComponent' passes to its
// 'errorComponent', so it can be used there directly; 'name' is supplied by the caller through an extending component.
// 'retry' is optional only because the props mirror that contract — every load now arrives through 'defineAsyncPanel',
// which always supplies it. The reload fallback stands as a backstop if this is ever rendered by hand.
const { error, name, retry } = defineProps<{ error: unknown; name?: string; retry?: () => void }>();

// 'defineAsyncComponent' also passes 'fail' and 'attempts', which are not used here. Without this they would land on
// the root as attributes, and on the stale-deployment path there is no root element to receive them.
defineOptions({ inheritAttrs: false });

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const loadError = shallowRef<AppError | undefined>();
const loadErrorWasReported = ref<boolean | undefined>(); // Undefined while the report is in flight.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Watched rather than run once: a failed retry re-renders this component with a new error rather than remounting it.
watch(() => error, handleError, { immediate: true });

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetry(): void {
    if (retry) {
        retry();
        return;
    }
    location.reload();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleError(newError: unknown): Promise<void> {
    const data = { componentName: name ?? 'Unknown', typeId: 'componentLoad' };
    const appError = new AppError(`Failed to load the ${name ?? 'unknown'} component.`, 'dpuse.componentLoadFailure', data, { cause: newError });

    // A stale deployment cannot be fixed by anything this component could offer, and the component it replaces may be
    // in a space too small to explain that, so the app-wide refresh banner takes it and nothing renders here.
    if (classifyError(newError, 'recoverable') === 'staleDeploy') {
        raiseStaleDeployFailure(appError);
        return;
    }

    loadError.value = appError;
    loadErrorWasReported.value = await reportAppError(appError);
}
</script>

<template>
    <ErrorDisplay v-if="loadError" :error="loadError" :error-was-reported="loadErrorWasReported" @retry="handleRetry" />
</template>
