<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    text: string;
    color?: 'danger' | 'success' | 'warning';
}
const { text, color } = defineProps<Properties>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const colorClasses = computed(() => {
    switch (color) {
        case 'warning':
            return 'bg-warning text-warning-text inset-ring-warning-ring/20';
        case 'success':
            return 'bg-success text-success-text inset-ring-success-ring/20';
        case 'danger':
            return 'bg-danger text-danger-text inset-ring-danger-ring/20';
        default:
            return 'bg-zinc-100 text-emphasis inset-ring-zinc-300/60 dark:bg-zinc-300/20 dark:text-content dark:inset-ring-zinc-500/30';
    }
});
</script>

<template>
    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium inset-ring" :class="colorClasses">
        {{ text }}
    </span>
</template>
