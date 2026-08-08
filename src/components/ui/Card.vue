<script setup lang="ts">
// ── External Dependencies & Registrations ───────────────────────────────────────────────────────────────────────────

import Button from '@/components/ui/button/Button.vue';
import { InfoIcon } from '@lucide/vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

type Badge = { id: string; color?: string; label: string };
type ActionTypeId = 'info';
type Action = { typeId: ActionTypeId; onClick: () => void };
type Properties = { actions?: Action[]; badges?: Badge[]; description?: string; icon?: string; iconDark?: string; isCompact?: boolean; label: string; overline?: string };
const { actions = [], badges = [], description, icon, iconDark, isCompact = false, label, overline } = defineProps<Properties>();
</script>

<template>
    <div
        class="relative flex size-full cursor-pointer flex-col gap-y-4 bg-card font-light outline -outline-offset-1 outline-boundary transition-colors hover:bg-card-hover hover:outline-boundary-hover active:bg-card-hover"
        :class="isCompact ? 'justify-center rounded-md px-2' : 'rounded-lg p-4'"
        data-region="Card"
        role="presentation"
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
            <div v-if="icon || iconDark" class="flex flex-none items-center justify-center rounded-md" :class="isCompact ? 'size-4.5' : 'size-6.5'">
                <!-- Only split into two v-html copies when the SVGs actually differ; otherwise rendering the same markup twice duplicates element ids (mask/gradient), which can break references when one copy is display:none. -->
                <template v-if="icon && iconDark && icon !== iconDark">
                    <div aria-hidden="true" class="block w-full text-zinc-400 dark:hidden [&>svg]:max-h-8 [&>svg]:max-w-8" v-html="icon" />
                    <div aria-hidden="true" class="hidden w-full text-zinc-400 dark:block [&>svg]:max-h-8 [&>svg]:max-w-8" v-html="iconDark" />
                </template>
                <div v-else aria-hidden="true" class="w-full text-zinc-400 [&>svg]:max-h-8 [&>svg]:max-w-8" v-html="icon ?? iconDark" />
            </div>

            <div class="flex flex-col overflow-x-hidden">
                <div v-if="!isCompact && overline" class="min-w-0 truncate text-xs leading-tight font-normal text-muted">{{ overline }}</div>
                <div class="min-w-0 truncate text-[16px] leading-tight">{{ label }}</div>
            </div>
        </div>

        <!-- Description -->
        <div v-if="!isCompact && description" class="line-clamp-2 text-sm text-muted">
            {{ description }}
        </div>

        <!-- Actions -->
        <div v-if="actions.length > 0" class="absolute right-0 bottom-0 flex gap-x-1 pr-1.5 pb-1.5">
            <template v-for="action in actions" :key="action.typeId">
                <Button v-if="action.typeId === 'info'" aria-label="Info" shape="icon" size="sm" @click.stop="action.onClick">
                    <InfoIcon aria-hidden="true" :stroke-width="1.25" />
                </Button>
            </template>
        </div>
    </div>
</template>
