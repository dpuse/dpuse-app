<script setup lang="ts">
// Options, Properties, Slots & Emits
type Badge = { id: string; color?: string; label: string };
type Properties = { badges?: Badge[]; description?: string; icon?: string; iconDark?: string; iconColor?: string; label: string; overline?: string };
const { badges = [], description, icon, iconDark, iconColor, label, overline } = defineProps<Properties>();
</script>

<template>
    <div
        class="bg-card outline-boundary hover:bg-card-hover hover:outline-boundary-hover active:bg-card-hover relative flex h-full w-full cursor-pointer flex-col gap-y-4 rounded-lg p-4 font-light outline -outline-offset-1 transition-colors"
    >
        <!-- <div
        class="bg-card outline-boundary hover:bg-card-hover hover:outline-boundary-hover active:opacity-75 relative flex h-full w-full cursor-pointer flex-col gap-y-4 rounded-lg p-4 font-light outline -outline-offset-1 transition-colors"
    > -->
        <!-- Badges -->
        <div v-if="badges.length > 0" class="absolute top-0 right-0 flex gap-x-1 pt-1.5 pr-1.5">
            <template v-for="badge in badges" :key="badge.id">
                <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium inset-ring"
                    :class="{
                        'bg-gray-50 text-gray-600 inset-ring-gray-500/10': badge.color === undefined,
                        'bg-red-50 text-red-700 inset-ring-red-600/10': badge.color === 'danger',
                        'bg-yellow-50 text-yellow-800 inset-ring-yellow-600/20': badge.color === 'warning'
                    }"
                >
                    {{ badge.label }}
                </span>
            </template>
        </div>

        <!-- Icon, Overline & Label -->
        <div class="flex items-center gap-x-2">
            <div v-if="icon || iconDark" class="flex size-8 flex-none items-center justify-center rounded-md">
                <div aria-hidden="true" class="block w-full dark:hidden" :style="iconColor ? { color: iconColor } : undefined" v-html="icon || iconDark" />
                <div aria-hidden="true" class="hidden w-full dark:block" :style="iconColor ? { color: iconColor } : undefined" v-html="iconDark || icon" />
            </div>

            <div class="flex flex-col overflow-x-hidden">
                <div v-if="overline" class="text-muted min-w-0 truncate text-xs leading-tight font-normal">{{ overline }}</div>
                <div class="min-w-0 truncate text-[16px] leading-tight">{{ label }}</div>
            </div>
        </div>

        <!-- Description -->
        <div v-if="description" class="text-muted line-clamp-2 text-sm">
            {{ description }}
        </div>
    </div>
</template>
