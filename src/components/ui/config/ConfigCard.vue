<script setup lang="ts" generic="T extends BaseConfig = BaseConfig">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';
import { InfoIcon, TrashIcon } from '@lucide/vue';

// ── DPUse Framework
import type { BaseConfig } from '@dpuse/dpuse-shared';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { Action } from './configCard';

// ── Static Components
import BaseButton from '@/components/ui/button/BaseButton.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

type StatusColor = 'danger' | 'info' | 'success' | 'warning';
interface Badge {
    id: string;
    color?: StatusColor;
    label: string;
}
interface Properties<T extends BaseConfig> {
    actions?: Action<T>[];
    badges?: Badge[];
    config: LocalisedConfig<T>;
    isCompact?: boolean;
    overline?: string;
    selected?: boolean;
    statusColor?: StatusColor;
    statusMessage?: string;
    to?: RouteLocationRaw;
}
const { actions = [], badges = [], config, isCompact, overline, selected, statusColor = 'warning', statusMessage, to } = defineProps<Properties<T>>();
</script>

<template>
    <BaseButton
        class="relative flex size-full flex-col border"
        :class="[
            isCompact ? 'justify-center rounded-md px-2' : 'rounded-lg p-4',
            selected
                ? 'border-selected-border bg-selected hover:bg-selected-hover'
                : 'border-separator bg-card hover:border-boundary-hover hover:bg-card-hover active:bg-card-hover'
        ]"
        data-region="ConfigCard"
        :to="to"
    >
        <!-- Badges -->
        <div v-if="!isCompact" class="absolute top-1.5 right-1.5 flex gap-x-1">
            <template v-for="badge in badges" :key="badge.id">
                <span
                    class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium inset-ring"
                    :class="{
                        'bg-zinc-100 text-emphasis inset-ring-zinc-300/60 dark:bg-zinc-300/20 dark:text-content dark:inset-ring-zinc-500/30': badge.color === undefined,
                        'bg-danger text-danger-text inset-ring-danger-ring/20': badge.color === 'danger',
                        'bg-warning text-warning-text inset-ring-warning-ring/20': badge.color === 'warning',
                        'bg-success text-success-text inset-ring-success-ring/20': badge.color === 'success',
                        'bg-info text-info-text inset-ring-info-ring/20': badge.color === 'info'
                    }"
                >
                    {{ badge.label }}
                </span>
            </template>
        </div>

        <!-- Header -->
        <div class="flex items-center gap-x-2">
            <!-- Icon -->
            <ConfigIcon :class="isCompact ? 'size-5' : 'size-7'" :icon="config.icon" :icon-dark="config.iconDark" />

            <div class="flex flex-col overflow-x-hidden">
                <!-- Overline -->
                <div v-if="!isCompact && overline" class="min-w-0 truncate text-xs leading-tight text-muted">{{ overline }}</div>

                <!-- Label -->
                <div class="min-w-0 truncate leading-tight text-muted">{{ config.label }}</div>
            </div>
        </div>

        <!-- Actions -->
        <div v-if="actions.length > 0 && config" class="flex items-center gap-x-1 place-self-end">
            <template v-for="action in actions" :key="action.typeId">
                <BaseButton v-if="action.typeId === 'delete'" aria-label="Delete" class="rounded-md border border-boundary p-1.5" @click.stop="action.onClick(config)">
                    <TrashIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
                </BaseButton>

                <BaseButton v-if="action.typeId === 'open'" aria-label="Open" class="rounded-md border border-boundary p-0.5" @click.stop="action.onClick(config)">
                    <svg
                        viewBox="0 0 24 24"
                        class="size-7"
                        :class="selected ? 'fill-sky-100 stroke-sky-700 dark:fill-sky-800 dark:stroke-sky-200' : 'fill-sky-50 stroke-sky-600 dark:fill-sky-900 dark:stroke-sky-400'"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <circle :class="selected ? 'stroke-sky-400 dark:stroke-sky-700' : 'stroke-sky-200 dark:stroke-sky-800'" cx="12" cy="12" r="10" stroke-width="1" />
                        <path d="m12 16 4-4-4-4" stroke-width="1.75" />
                        <path d="M8 12h8" stroke-width="1.75" />
                    </svg>
                </BaseButton>

                <BaseButton v-if="action.typeId === 'info'" aria-label="Information" class="rounded-md border border-boundary p-1.5" @click.stop="action.onClick(config)">
                    <InfoIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
                </BaseButton>
            </template>
        </div>

        <!-- Status -->
        <div
            v-if="!isCompact && statusMessage"
            class="absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-xs inset-ring"
            :class="{
                'bg-danger text-danger-text inset-ring-danger-ring/20': statusColor === 'danger',
                'bg-warning text-warning-text inset-ring-warning-ring/20': statusColor === 'warning',
                'bg-success text-success-text inset-ring-success-ring/20': statusColor === 'success',
                'bg-info text-info-text inset-ring-info-ring/20': statusColor === 'info'
            }"
        >
            {{ statusMessage }}
        </div>
    </BaseButton>
</template>
