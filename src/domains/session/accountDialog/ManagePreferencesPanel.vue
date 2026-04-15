<script setup lang="ts">
// App Framework
import { localeId } from '@/translations';

// App Static Components
import Button from '@/components/ui/button/Button.vue';
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <Button @click="localeId = 'en'">English</Button>
        <Button @click="localeId = 'es'">Español</Button>
    </div>
</template>
