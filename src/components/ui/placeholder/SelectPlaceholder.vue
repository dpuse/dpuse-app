<script setup lang="ts">
// ── Static Components
import MousePointerClickRotatedIcon from '@/components/icons/MousePointerClickRotatedIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    message: string;
}
const { message } = defineProps<Properties>();
</script>

<template>
    <div class="flex items-start gap-2 leading-tight text-muted" data-region="SelectPlaceholder">
        <MousePointerClickRotatedIcon class="size-6 flex-none" :stroke-width="1.5" aria-hidden="true" />
        <span class="leading-6">{{ message }}</span>
    </div>
</template>
