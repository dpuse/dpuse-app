<script setup lang="ts">
//
type Badge = { id: string; color?: string; label: string };

// Properties & Emits
type Properties = { badges?: Badge[]; icon?: string; iconColor?: string; label: string; overline?: string };
const { badges = [], icon, iconColor, label, overline } = defineProps<Properties>();
</script>

<template>
    <div class="bg-card outline-boundary relative flex h-full w-full cursor-pointer flex-col gap-y-4 overflow-hidden rounded-lg p-4 font-light outline -outline-offset-1">
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

        <div v-if="icon" aria-hidden="true" style="height: 32px; width: 32px" :style="iconColor ? { color: iconColor } : undefined" v-html="icon" />

        <div class="flex flex-col">
            <div v-if="overline" class="text-muted text-xs font-normal">{{ overline }}</div>
            <div>{{ label }}</div>
        </div>
    </div>
</template>
