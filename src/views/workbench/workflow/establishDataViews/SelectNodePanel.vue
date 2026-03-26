<script setup lang="ts"></script>

<template>
    <div class="px-4 pt-1">
        <div>Select node...</div>
        <RouterLink :to="{ name: 'auditContent', query: { ...$route.query, wbView: 'auditContent' } }">Next...</RouterLink>
    </div>
</template>
