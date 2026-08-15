<script setup lang="ts" generic="T extends BaseConfig = BaseConfig">
// ── External Dependencies & Registrations ───────────────────────────────────────────────────────────────────────────

import type { BaseConfig } from '@dpuse/dpuse-shared';
import Button from '@/components/ui/button/Button.vue';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';
import { ArrowRightIcon, InfoIcon, PenSquareIcon, TrashIcon } from '@lucide/vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

type Badge = { id: string; color?: string; label: string };
type ActionTypeId = 'edit' | 'delete' | 'info' | 'open';
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
                ? 'bg-sky-50 outline-sky-200 hover:bg-sky-100 hover:outline-sky-200'
                : 'bg-card outline-boundary hover:bg-card-hover hover:outline-boundary-hover active:bg-card-hover'
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
            <div v-if="config.icon || config.iconDark" class="flex flex-none items-center justify-center rounded-md" :class="isCompact ? 'size-4.5' : 'size-6.5'">
                <!-- Only split into two v-html copies when the SVGs actually differ; otherwise rendering the same markup twice duplicates element ids (mask/gradient), which can break references when one copy is display:none. -->
                <template v-if="config.icon && config.iconDark && config.icon !== config.iconDark">
                    <div aria-hidden="true" class="block w-full text-zinc-400 dark:hidden [&>svg]:max-h-8 [&>svg]:max-w-8" v-html="config.icon" />
                    <div aria-hidden="true" class="hidden w-full text-zinc-400 dark:block [&>svg]:max-h-8 [&>svg]:max-w-8" v-html="config.iconDark" />
                </template>
                <div v-else aria-hidden="true" class="w-full text-zinc-400 [&>svg]:max-h-8 [&>svg]:max-w-8" v-html="config.icon ?? config.iconDark" />
            </div>

            <div class="flex flex-col overflow-x-hidden">
                <div v-if="!isCompact && overline" class="min-w-0 truncate text-xs leading-tight font-normal text-muted">{{ overline }}</div>
                <div class="min-w-0 truncate text-[16px] leading-tight">{{ config.label }}</div>
            </div>
        </div>

        <!-- Description -->
        <div v-if="!isCompact && config.description" class="line-clamp-2 flex-none text-left text-sm text-muted">
            <!-- {{ config.description }} -->
            This is a description that is clamped to two lines so we can test how it is truncated. This is a second sentence just to make absolutely certain it will be truncated.
        </div>

        <!-- Actions -->
        <div v-if="actions.length > 0 && config" class="flex gap-x-1 place-self-end">
            <template v-for="action in actions" :key="action.typeId">
                <Button v-if="action.typeId === 'open'" aria-label="Open" class="p-1.5" shape="minimal" @click.stop="action.onClick(config)">
                    <ArrowRightIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
                </Button>
                <Button v-if="action.typeId === 'edit'" aria-label="Edit" class="p-1.5" shape="minimal" @click.stop="action.onClick(config)">
                    <PenSquareIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
                </Button>
                <Button v-if="action.typeId === 'delete'" aria-label="Delete" class="p-1.5" shape="minimal" @click.stop="action.onClick(config)">
                    <TrashIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
                </Button>
                <Button v-if="action.typeId === 'info'" aria-label="Information" class="p-1.5" shape="minimal" @click.stop="action.onClick(config)">
                    <InfoIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
                </Button>
            </template>
        </div>

        <!-- Status -->
        <div v-if="!isCompact && statusMessage" class="absolute bottom-2 left-2 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
            {{ statusMessage }}
        </div>
    </div>
</template>
