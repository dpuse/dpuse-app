<script setup lang="ts">
// Shows the content only once its data has arrived: a busy bar until then, or the failure if retrieval failed. The
// failure offers no Retry, because the configuration reconnects by itself and the other retrievals cannot be retried.

// ── Local Framework
import type { RetrievalStatus } from '@/state/configs';

// ── Static Components
import BusyBar from '@/components/ui/BusyBar.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Attributes go to the failure only. The content can be several elements, and the busy bar keeps its own size.
defineOptions({ inheritAttrs: false });
const { status } = defineProps<{ status: RetrievalStatus }>();
defineSlots<{ default: () => unknown }>();
</script>

<template>
    <BusyBar v-if="status.typeId === 'pending'" class="mx-4" />
    <ErrorNotice v-else-if="status.typeId === 'failed'" v-bind="$attrs" :can-retry="false" :failures="[status.failure]" />
    <slot v-else />
</template>
