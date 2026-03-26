<script setup lang="ts"></script>

<template>
    <div class="px-4 pt-1">
        <div>Transform...</div>
        <RouterLink :to="{ name: 'investigate', query: { ...$route.query, wbView: 'investigate' } }">Next...</RouterLink>
    </div>
</template>
