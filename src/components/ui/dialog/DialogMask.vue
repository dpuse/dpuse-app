<script setup lang="ts">
// Local (App) Framework
import { busyLoadingState } from '@/state/appProgress';
</script>

<template>
    <div
        aria-hidden="true"
        class="fixed inset-0 hidden transition-colors duration-300 md:block"
        :class="busyLoadingState.isBlocking.value ? 'bg-transparent' : 'bg-overlay'"
        data-region="DialogMask"
    />
</template>
