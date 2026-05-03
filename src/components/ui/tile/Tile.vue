<script setup lang="ts">
// Options, Properties, Slots & Emits
const { icon, iconDark, label } = defineProps<{ icon?: string; iconDark?: string; label: string; overline?: string }>();
</script>

<template>
    <div class="flex min-w-0 items-center gap-x-2 px-2">
        <!-- Icon -->
        <div v-if="icon || iconDark" class="flex size-6 flex-none items-center justify-center rounded-md">
            <div aria-hidden="true" class="block w-5.5 dark:hidden" v-html="icon || iconDark" />
            <div aria-hidden="true" class="hidden w-5.5 dark:block" v-html="iconDark || icon" />
        </div>

        <!-- Label -->
        <div class="min-w-0 truncate">{{ label }}</div>
    </div>
</template>
