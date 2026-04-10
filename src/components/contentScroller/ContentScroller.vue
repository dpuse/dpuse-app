<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';

// Properties & Emits
const emit = defineEmits<{ scrolledFromTop: [value: boolean] }>();

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const element = ref<HTMLElement | null>(null);

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function onScroll(): void {
    emit('scrolledFromTop', element.value!.scrollTop > 0);
}
</script>

<template>
    <div ref="element" class="flex-1 overflow-y-auto overscroll-y-none pb-16" @scroll.passive="onScroll">
        <slot />
    </div>
</template>
