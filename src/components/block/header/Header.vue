<script setup lang="ts">
// Properties
type Properties = { title: string };
const properties = defineProps<Properties>();
</script>

<template>
    <div class="flex-none px-4">
        <div class="flex h-14 w-full flex-none items-center border-b pr-4 pl-12 text-lg font-light md:pl-0">
            {{ properties.title }}
        </div>
    </div>
</template>
