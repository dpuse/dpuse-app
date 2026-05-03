<script setup lang="ts">
// Options, Properties, Slots & Emits
type Badge = { id: string; color?: string; label: string };
type Properties = { badges?: Badge[]; icon?: string; iconDark?: string; iconColor?: string; label: string; overline?: string };
const { badges = [], icon, iconDark, iconColor, label, overline } = defineProps<Properties>();
</script>

<template>
    <div class="bg-card outline-boundary relative flex h-full w-full cursor-pointer flex-col gap-y-4 rounded-lg p-4 font-light outline -outline-offset-1">
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

        <div v-if="icon || iconDark" class="flex size-10 items-center justify-center rounded-md">
            <div aria-hidden="true" class="block w-9 dark:hidden" :style="iconColor ? { color: iconColor } : undefined" v-html="icon || iconDark" />
            <div aria-hidden="true" class="hidden w-9 dark:block" v-html="iconDark || icon" />
        </div>

        <div class="flex flex-col">
            <div v-if="overline" class="text-muted text-xs font-normal">{{ overline }}</div>
            <div>{{ label }}</div>
        </div>
    </div>
</template>
