<script setup lang="ts">
// ── External Dependencies & Registrations
import { shallowRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Static Components
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Shown in place of a component that failed to load, and the one place that turns Vue's bare rejection into a failure
// this app can do something with: it names the component, which is what later lets a display say what was lost, and
// raises it, which is what reports it.
//
// Only 'error' comes from 'defineAsyncComponent', whatever its options documentation suggests — the error component is
// mounted with that prop alone. 'name' and 'retry' are supplied by 'defineAsyncPanel', which is also why 'retry' can
// remount the panel for a genuine second attempt where Vue's own hook could not. Both stay optional so this still
// renders if it is ever used by hand, where the reload is the only recovery left.
const { error, name, ownsScreen, retry } = defineProps<{ error: unknown; name?: string; ownsScreen?: boolean; retry?: () => void }>();
const emit = defineEmits<{ dismiss: [] }>();

// There is no root element to receive attributes until a failure has been captured, so anything falling through would
// have nowhere to land.
defineOptions({ inheritAttrs: false });

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const loadFailure = shallowRef<AppFailure | undefined>();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Watched rather than run once: a failed retry re-renders this component with a new error rather than remounting it.
// A chunk this deployment can no longer fetch is displayed here like any other failure — this is the space the missing
// component would have occupied, so it is where its absence is worth explaining, and the display offers the reload
// that is the only thing which can actually fix it.
watch(
    () => error,
    (newError) => {
        // The locator and 'typeId' keep the old wording deliberately, though this component no longer carries it: they
        // are the identifiers every report already sent to Axiom was filed under, and renaming them would split the
        // history at the rename for no gain in what they identify.
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
         exactly what has failed. An overlay has no such space, so its failure takes the screen instead. -->
    <ErrorNotice
        v-if="loadFailure"
        :covers-region="!ownsScreen"
        :failures="[loadFailure]"
        :is-dismissible="ownsScreen"
        :owns-screen="ownsScreen"
        @dismiss="emit('dismiss')"
        @retry="handleRetry"
    />
</template>
