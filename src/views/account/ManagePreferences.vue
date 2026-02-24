<script setup lang="ts">
// App core
import { localeId } from '@/locales';

// App components
import ActionButton from '~/src/components/action/ActionButton.vue';
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <ActionButton @click="localeId = 'en'">English</ActionButton>
        <ActionButton @click="localeId = 'es'">Español</ActionButton>
    </div>
</template>
