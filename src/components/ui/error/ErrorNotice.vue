<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { TriangleAlertIcon } from '@lucide/vue';

// ── DPUse Framework
import { type AppError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// 'errorWasReported' is undefined while the report is still in flight, so the notice says the reporting is pending
// rather than claiming it could not be confirmed — see the reporting note in the template.
const { error, errorWasReported } = defineProps<{ error: AppError; errorWasReported: boolean | undefined }>();
defineEmits<{ retry: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const mainSerialisedError = computed(() => serialiseError(error)[0]);
</script>

<template>
    <div class="flex items-center justify-between gap-2 rounded-md border border-warning-ring/20 bg-warning px-3 py-1.5 text-xs text-warning-text">
        <span class="flex items-center gap-1.5">
            <TriangleAlertIcon class="size-3.5 shrink-0" />
            {{ mainSerialisedError.message }} See the browser console for more details.
            <span v-if="errorWasReported == null">Logging this error with DPUse Support&hellip;</span>
            <span v-else-if="errorWasReported">This error has been logged with DPUse Support for investigation.</span>
            <span v-else class="font-semibold">Unable to confirm this error was logged with DPUse Support.</span>
        </span>
        <Button class="shrink-0" shape="minimal" variant="guarded" size="sm" @click="$emit('retry')">Retry</Button>
    </div>
</template>
