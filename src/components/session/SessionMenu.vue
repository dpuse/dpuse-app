<script setup lang="ts">
// App components
import Separator from '@/components/separator/Separator.vue';
</script>

<template>
    <div class="border-boundary bg-backdrop flex flex-col gap-y-1 rounded-md border px-4 py-3 shadow-sm">
        <div class="text-muted text-sm font-medium">Appearance</div>
        <div>Dark | Light | System</div>
        <div class="text-muted text-sm font-medium">Full screen</div>
        <div>Toggle...</div>
        <div class="text-muted text-sm font-medium">Language</div>
        <div>English | Español</div>
        <div class="text-muted text-sm font-medium">Region</div>
        <div>English | Español</div>
        <Separator class="my-1" />
        <div>Manage account...</div>
        <Separator class="my-1" />
        <div>Sign in/up/out</div>
    </div>
</template>
