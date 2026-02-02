<script setup lang="ts">
import { computed } from 'vue';

import { useSessionStore } from '@/stores/sessionStore';

const sessionState = useSessionStore();

const expiresIn = computed(() => sessionState.expiresIn);

const timeParts = computed(() => {
    const totalSeconds = Math.floor((expiresIn.value || 0) / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { hours, minutes, seconds };
});

const formattedTime = computed(() => {
    const { hours, minutes, seconds } = timeParts.value;

    return `${String(hours).padStart(2, '0')}:` + `${String(minutes).padStart(2, '0')}:` + `${String(seconds).padStart(2, '0')}`;
});
</script>

<template>
    <div class="flex h-full items-center justify-center gap-x-4 text-xs">
        <div>© Jonathan Terrell</div>
        <div>{{ expiresIn }}</div>
        <div>{{ formattedTime }}</div>
    </div>
</template>
