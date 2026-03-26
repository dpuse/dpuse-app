<script setup lang="ts"></script>

<template>
    <div class="px-4 pt-1">
        <div>Audit relationships...</div>
        <RouterLink :to="{ name: 'transform', query: { ...$route.query, wbView: 'transform' } }">Next...</RouterLink>
    </div>
</template>
