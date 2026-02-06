<script setup lang="ts">
import { computed } from 'vue';

import { useSessionStore } from '@/stores/sessionStore';

const sessionState = useSessionStore();

const expiresAt = computed(() => sessionState.expiresAt);
const expiresIn = computed(() => sessionState.expiresIn);
const lifetime = computed(() => sessionState.lifetime);

const elapsed = computed(() => (lifetime.value ? ((lifetime.value - (expiresIn.value || 0)) / lifetime.value) * 100 : 0));

const formattedExpiryTime = computed(() => {
    if (!expiresAt.value) return '';
    return new Date(expiresAt.value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });
});
</script>

<template>
    <div class="flex h-6 items-center justify-center gap-x-4 text-xs">
        <div>© Jonathan Terrell</div>
        <div class="relative flex w-40 items-center justify-start rounded-xs border bg-neutral-50">
            <div class="absolute top-0 bottom-0 left-0 bg-green-100" :style="{ width: `${elapsed}%` }"></div>
            <div class="relative pl-1">Expires at {{ formattedExpiryTime }}</div>
        </div>
    </div>
</template>
