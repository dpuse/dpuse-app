<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Badge = { id: string; color?: string; label: string };
type Properties = { badges?: Badge[]; description?: string; icon?: string; iconDark?: string; iconNeutral?: string; isCompact?: boolean; label: string; overline?: string };
const { badges = [], description, icon, iconDark, iconNeutral, isCompact = false, label, overline } = defineProps<Properties>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const isHovering = ref(false);
</script>

<template>
    <div
        class="relative flex h-full w-full cursor-pointer flex-col gap-y-4 bg-card font-light outline -outline-offset-1 outline-boundary transition-colors hover:bg-card-hover hover:outline-boundary-hover active:bg-card-hover"
        :class="isCompact ? 'justify-center rounded-md px-2' : 'rounded-lg p-4'"
        data-region="Card"
        role="presentation"
        @focusin="isHovering = true"
        @focusout="isHovering = false"
        @mouseenter="isHovering = true"
        @mouseleave="isHovering = false"
    >
        <!-- Badges -->
        <div v-if="!isCompact" class="absolute top-0 right-0 flex gap-x-1 pt-1.5 pr-1.5">
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
            <div v-if="icon || iconDark || iconNeutral" class="flex flex-none items-center justify-center rounded-md" :class="isCompact ? 'size-6' : 'size-8'">
                <div v-if="!isHovering" aria-hidden="true" class="block w-full text-zinc-400 dark:hidden dark:text-zinc-400" v-html="iconNeutral || icon || iconDark" />
                <div v-if="!isHovering" aria-hidden="true" class="hidden w-full text-zinc-400 dark:block dark:text-zinc-400" v-html="iconNeutral || iconDark || icon" />
                <div v-if="isHovering" aria-hidden="true" class="block w-full text-zinc-400 dark:hidden dark:text-zinc-400" v-html="icon || iconDark" />
                <div v-if="isHovering" aria-hidden="true" class="hidden w-full text-zinc-400 dark:block dark:text-zinc-400" v-html="iconDark || icon" />
            </div>

            <div class="flex flex-col overflow-x-hidden">
                <div v-if="!isCompact && overline" class="text-muted min-w-0 truncate text-xs leading-tight font-normal">{{ overline }}</div>
                <div class="min-w-0 truncate text-[16px] leading-tight">{{ label }}</div>
            </div>
        </div>

        <!-- Description -->
        <div v-if="!isCompact && description" class="text-muted line-clamp-2 text-sm">
            {{ description }}
        </div>
    </div>
</template>
