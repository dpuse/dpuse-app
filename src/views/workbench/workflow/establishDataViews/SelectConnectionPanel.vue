<script setup lang="ts">
import { useEstablishDataViewsProgress } from './useEstablishDataViewsProgress';

const { unlockedUpTo, reset } = useEstablishDataViewsProgress();
</script>

<template>
    <div class="px-4 pt-1">
        <div>Select connection...</div>
        <RouterLink :to="{ name: 'selectNode', query: { ...$route.query, wbView: 'selectNode' } }" @click="unlockedUpTo = 2">Next...</RouterLink>
    </div>
</template>
