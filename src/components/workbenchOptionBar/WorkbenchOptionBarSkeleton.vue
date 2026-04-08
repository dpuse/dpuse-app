<script setup lang="ts">
// App Core
import { displayIsWide } from '@/state/displayBreakpoint';
</script>

<template>
    <div>
        <!-- Wide: reserve sidebar space while content loads -->
        <div v-if="displayIsWide" class="border-boundary bg-backdrop h-full w-16.25 flex-none border-r" />

        <!-- Narrow: show overlay structure while content loads -->
        <div v-else class="fixed inset-0 z-30 flex">
            <div class="bg-surface/70 absolute inset-0" />
            <div class="border-boundary bg-backdrop h-full w-16.25 border-r" />
        </div>
    </div>
</template>
