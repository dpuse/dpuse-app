<script setup lang="ts">
// External Dependencies
import { onBeforeUnmount } from 'vue';

// App Core
import { contentScrollTop } from '@/state/appLayout';

// Side Effects ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onBeforeUnmount(() => (contentScrollTop.value = 0));
</script>

<template>
    <div class="flex-1 overflow-y-auto overscroll-y-none pb-16" @scroll.passive="contentScrollTop = ($event.target as HTMLElement).scrollTop ?? 0">
        <slot />
    </div>
</template>
