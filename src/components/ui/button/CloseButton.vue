<script setup lang="ts">
// ── External Dependencies & Registrations
import { XIcon } from '@lucide/vue';

// ── Static Components
import IconButton from '@/components/ui/button/IconButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    accessibleLabel?: string;
}
const { accessibleLabel = 'Close' } = defineProps<Properties>();
</script>

<template>
    <IconButton :accessible-label="accessibleLabel" data-region="CloseButton" rounded size="sm" variant="ghost">
        <XIcon class="size-5.5!" stroke-width="1.25" />
    </IconButton>
</template>
