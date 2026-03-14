<script setup lang="ts">
// App Core
import { localeId } from '@/locales';

// App Components - Statically imported so always available, even when offline.
import Button from '@/components/button/Button.vue';
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <Button @click="localeId = 'en'">English</Button>
        <Button @click="localeId = 'es'">Español</Button>
    </div>
</template>
