<script setup lang="ts">
// Global state dependencies.
import { useSessionStore } from '@/stores/sessionStore';

const sessionState = useSessionStore();
</script>

<template>
    <div class="flex h-full items-center justify-center overflow-y-auto">
        <UButton @click="sessionState.signOut()">Sign Out</UButton>
    </div>
</template>
