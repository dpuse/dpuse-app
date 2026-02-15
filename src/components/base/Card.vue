<script setup lang="ts">
//
type Badge = { id: string; color?: string; label: string };

// Properties
type Properties = { badges?: Badge[]; icon?: string; iconColor?: string; label: string; overline?: string };
const { badges = [], icon, iconColor, label, overline } = defineProps<Properties>();
</script>

<template>
    <div class="bg-background-card outline-border relative flex h-full w-full cursor-pointer flex-col gap-y-4 overflow-hidden rounded-lg p-4 font-light outline -outline-offset-1">
        <div v-if="badges.length > 0" class="absolute top-0 right-0"></div>

        <div v-if="icon" aria-hidden="true" class="size-8" :style="iconColor ? { color: iconColor } : undefined" v-html="icon" />

        <div class="flex flex-col">
            <div v-if="overline" class="text-foreground-secondary text-xs font-normal">{{ overline }}</div>
            <div>{{ label }}</div>
        </div>
    </div>
</template>
