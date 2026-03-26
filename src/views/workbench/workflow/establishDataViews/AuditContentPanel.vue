<script setup lang="ts"></script>

<template>
    <div class="px-4 pt-1">
        <div>Audit content...</div>
        <RouterLink :to="{ name: 'auditRelationships', query: { ...$route.query, wbView: 'auditRelationships' } }">Next...</RouterLink>
    </div>
</template>
