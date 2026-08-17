<script setup lang="ts" generic="T extends BaseConfig = BaseConfig">
// ── External Dependencies & Registrations
import { InfoIcon, TrashIcon } from '@lucide/vue';

// ── DPUse Framework
import type { BaseConfig } from '@dpuse/dpuse-shared';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

type Badge = { id: string; color?: string; label: string };
type ActionTypeId = 'delete' | 'info' | 'open';
type Action<T> = { typeId: ActionTypeId; onClick: (item: LocalisedConfig<T>) => void };
type Properties<T> = { actions?: Action<T>[]; badges?: Badge[]; config: LocalisedConfig<T>; isCompact?: boolean; overline?: string; selected?: boolean; statusMessage?: string };
const { actions = [], badges = [], config, isCompact = false, overline, selected = false, statusMessage } = defineProps<Properties<T>>();
</script>

<template>
    <div
        class="relative flex size-full cursor-pointer flex-col gap-y-2 outline -outline-offset-1 transition-colors"
        :class="[
            isCompact ? 'justify-center rounded-md px-2' : 'rounded-lg p-4',
            selected
                ? 'bg-[#f9fdff] outline-sky-200 hover:bg-sky-50 hover:outline-sky-200 dark:bg-sky-950 dark:outline-sky-800 dark:hover:bg-sky-900 dark:hover:outline-sky-800'
                : 'bg-card outline-separator hover:bg-card-hover hover:outline-boundary-hover active:bg-card-hover'
        ]"
        data-region="ConfigCard"
        role="presentation"
    >
        <!-- Badges -->
        <div v-if="!isCompact" class="absolute top-1.5 right-1.5 flex gap-x-1">
            <template v-for="badge in badges" :key="badge.id">
                <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium inset-ring"
                    :class="{
                        'bg-gray-100 text-gray-800 inset-ring-gray-300/60 dark:bg-gray-400/20 dark:text-gray-300 dark:inset-ring-gray-500/30': badge.color === undefined,
                        'bg-red-100 text-red-800 inset-ring-red-300/60 dark:bg-red-400/20 dark:text-red-300 dark:inset-ring-red-500/30': badge.color === 'danger',
                        'bg-amber-50 text-amber-800 inset-ring-amber-200/60 dark:bg-amber-400/10 dark:text-amber-300 dark:inset-ring-amber-500/20': badge.color === 'warning'
                    }"
                >
                    {{ badge.label }}
                </span>
            </template>
        </div>

        <!-- Icon, Overline & Label -->
        <div class="flex items-center gap-x-2">
            <div v-if="config.icon || config.iconDark" class="flex flex-none items-center justify-center rounded-md" :class="isCompact ? 'size-5' : 'size-7'">
                <!-- Only split into two v-html copies when the SVGs actually differ; otherwise rendering the same markup twice duplicates element ids (mask/gradient), which can break references when one copy is display:none. -->
                <template v-if="config.icon && config.iconDark && config.icon !== config.iconDark">
                    <div aria-hidden="true" class="block w-full dark:hidden [&>svg]:max-h-8 [&>svg]:max-w-8" v-html="config.icon" />
                    <div aria-hidden="true" class="hidden w-full dark:block [&>svg]:max-h-8 [&>svg]:max-w-8" v-html="config.iconDark" />
                </template>
                <div v-else aria-hidden="true" class="w-full [&>svg]:max-h-8 [&>svg]:max-w-8" v-html="config.icon ?? config.iconDark" />
            </div>

            <div class="flex flex-col overflow-x-hidden">
                <div v-if="!isCompact && overline" class="min-w-0 truncate text-xs leading-tight font-normal text-muted">{{ overline }}</div>
                <div class="min-w-0 truncate leading-tight text-content">{{ config.label }}</div>
            </div>
        </div>

        <!-- Description -->
        <div v-if="!isCompact && config.description" class="line-clamp-2 flex-none text-left text-sm text-muted">
            {{ config.description }}
        </div>

        <!-- Actions -->
        <div v-if="actions.length > 0 && config" class="flex items-center gap-x-1 place-self-end">
            <template v-for="action in actions" :key="action.typeId">
                <Button v-if="action.typeId === 'delete'" aria-label="Delete" class="p-1.5" shape="minimal" @click.stop="action.onClick(config)">
                    <TrashIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
                </Button>

                <Button v-if="action.typeId === 'open'" aria-label="Open" class="p-0.5" shape="minimal" @click.stop="action.onClick(config)">
                    <svg
                        viewBox="0 0 24 24"
                        class="size-6"
                        :class="selected ? 'fill-sky-100 stroke-sky-700 dark:fill-sky-800 dark:stroke-sky-200' : 'fill-sky-50 stroke-sky-600 dark:fill-sky-900 dark:stroke-sky-300'"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle :class="selected ? 'stroke-sky-300 dark:stroke-sky-700' : 'stroke-sky-200 dark:stroke-sky-800'" cx="12" cy="12" r="10" stroke-width="1" />
                        <path d="m12 16 4-4-4-4" />
                        <path d="M8 12h8" />
                    </svg>
                </Button>

                <Button v-if="action.typeId === 'info'" aria-label="Information" class="p-1.5" shape="minimal" @click.stop="action.onClick(config)">
                    <InfoIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
                </Button>
            </template>
        </div>

        <!-- Status -->
        <div
            v-if="!isCompact && statusMessage"
            class="absolute bottom-2 left-2 rounded-full px-2 py-0.5 text-xs inset-ring"
            :class="['bg-amber-50 text-amber-800 inset-ring-amber-200/60 dark:bg-amber-400/10 dark:text-amber-300 dark:inset-ring-amber-500/20']"
        >
            {{ statusMessage }}
        </div>
    </div>
</template>
