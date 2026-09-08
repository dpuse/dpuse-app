<script setup lang="ts">
// ── Local Framework
import { localeId } from '@/state/locale';

// ── Static Components
import RectangleButton from '@/components/ui/button/RectangleButton.vue';
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <RectangleButton @click="localeId = 'en'">English</RectangleButton>
        <RectangleButton @click="localeId = 'es'">Español</RectangleButton>
    </div>
</template>
