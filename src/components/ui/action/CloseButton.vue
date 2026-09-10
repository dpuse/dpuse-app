<script setup lang="ts">
// ── External Dependencies & Registrations
import { XIcon } from '@lucide/vue';

// ── Static Components
import IconButton from '@/components/ui/action/IconButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { accessibleLabel = 'Close' } = defineProps<{ accessibleLabel?: string }>();
</script>

<template>
    <IconButton :accessible-label="accessibleLabel" data-region="CloseButton" rounded size="sm">
        <XIcon class="size-5.5!" stroke-width="1.25" />
    </IconButton>
</template>
