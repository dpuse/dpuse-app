<script setup lang="ts">
// App Core
import { localeId } from '@/locales';

// App Components
import ActionButton from '@/components/action/ActionButton.vue';
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <ActionButton @click="localeId = 'en'">English</ActionButton>
        <ActionButton @click="localeId = 'es'">Español</ActionButton>
    </div>
</template>
