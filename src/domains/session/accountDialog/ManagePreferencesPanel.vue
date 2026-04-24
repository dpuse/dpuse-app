<script setup lang="ts">
// Local Framework
import { localeId } from '@/state/locale';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <Button @click="localeId = 'en'">English</Button>
        <Button @click="localeId = 'es'">Español</Button>
    </div>
</template>
