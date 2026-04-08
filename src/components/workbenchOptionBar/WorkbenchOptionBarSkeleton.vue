<script setup lang="ts">
// App Core
import { displayIsWide } from '@/state/displayBreakpoint';
</script>

<template>
    <div>
        <!-- Wide: reserve sidebar space while content loads -->
        <div v-if="displayIsWide" class="border-boundary bg-backdrop h-full w-16.25 flex-none border-r" />
    </div>
</template>
