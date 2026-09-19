<script setup lang="ts" generic="T extends BaseConfig = BaseConfig">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';
import { ArrowRightIcon, InfoIcon, TrashIcon } from '@lucide/vue';

// ── DPUse Framework
import type { BaseConfig } from '@dpuse/dpuse-shared';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { Action, Badge, StatusColor } from './configCard';
import { PILL_CLASSES, PILL_FILL_CLASSES } from '@/components/ui/action/action';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Colour only where a badge needs attention: red for errors, amber for warnings. Everything else is a neutral grey,
// so a card's colours point at problems rather than competing with its progress dots.
const BADGE_DOT_CLASSES: Record<StatusColor | 'neutral', string> = {
    danger: 'bg-red-500',
    info: 'bg-zinc-400',
    neutral: 'bg-zinc-400',
    success: 'bg-zinc-400',
    warning: 'bg-amber-400'
};

// The round buttons are the open pill's neutral twin: a border of the same weight, their own white fill and shadow so
// they hold up on a hovered or selected card, and a darker fill on hover. 28px with a mouse, 34px on touch.
const ROUND_ACTION_CLASSES =
    'flex size-7 items-center justify-center rounded-full border border-zinc-300 bg-surface shadow-xs hover:bg-zinc-100 pointer-coarse:size-8.5 dark:border-zinc-600 dark:hover:bg-zinc-800';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties<T extends BaseConfig> {
    actions?: Action<T>[];
    badges?: Badge[];
    config: LocalisedConfig<T>;
    isCompact?: boolean;
    overline?: string;
    selected?: boolean;
    to?: RouteLocationRaw;
}
const { actions = [], badges = [], config, isCompact, overline, selected, to } = defineProps<Properties<T>>();

defineSlots<{ status?: () => unknown }>();

// Listeners like '@click' from the host land on the card-activation button below rather than on the root, which
// carries no interactive semantics of its own.
defineOptions({ inheritAttrs: false });
</script>

<template>
    <!-- A full-size card is a fixed height, so every card in a virtualised grid row matches: a title row, then a footer
         row of badges and actions, each 'h-7' in 'p-3' with a 'gap-y-3' between. 'useCardRowHeight' in './configCard'
         states the same numbers. Compact is a single plain list row. -->
    <div
        class="relative flex size-full border"
        :class="[
            isCompact ? 'items-center gap-x-2 rounded-md px-2' : 'flex-col gap-y-3 rounded-lg p-3',
            // Compact is a plain list row rather than a boxed card: no border or fill until hovered or selected. The border
            // stays, transparent, so a row is the same size in every state. Selected is a step darker than a selected card,
            // which has its border to help it stand out; a row has only the fill, next to rows showing a grey hover. A selected
            // card's fill is lighter than the lightest blue step, so it tints the card without weighing it down.
            isCompact
                ? selected
                    ? 'border-transparent bg-selected-hover hover:bg-blue-200/70 dark:hover:bg-blue-800'
                    : 'border-transparent hover:bg-card-hover active:bg-card-hover'
                : selected
                  ? 'border-selected-border bg-selected/60 hover:bg-selected'
                  : 'border-separator bg-card hover:border-boundary-hover hover:bg-card-hover active:bg-card-hover'
        ]"
        data-region="ConfigCard"
    >
        <!-- Card activation, stretched to cover the card rather than wrapping its content. A 'button' or anchor may
             not contain other interactive content, and this is the one element here that is genuinely one — the
             actions below are real, independently focusable buttons, kept clickable by sitting above this in
             stacking order rather than inside it. The title shows the full label, which the row may truncate. -->
        <ActionWrapper
            :aria-label="overline ? `${overline}: ${config.label}` : config.label"
            class="absolute inset-0 z-10"
            :title="config.label"
            :to="to"
            v-bind="$attrs"
        />

        <!-- Header - One line only: the label truncates rather than wraps, because the card cannot grow. -->
        <div class="flex min-w-0 items-center gap-x-2" :class="isCompact ? 'flex-1' : 'h-7 flex-none'">
            <!-- Icon -->
            <ConfigIcon :class="isCompact ? 'size-5' : 'size-7'" :icon="config.icon" :icon-dark="config.iconDark" />

            <div class="flex min-w-0 flex-col">
                <!-- Overline -->
                <div v-if="!isCompact && overline" class="min-w-0 truncate text-xs leading-tight text-muted">{{ overline }}</div>

                <!-- Label -->
                <div class="min-w-0 truncate leading-tight text-muted">{{ config.label }}</div>
            </div>
        </div>

        <!-- Footer - Badges on the left as a dot and text, so they read as information rather than as more buttons
             beside the round actions. They wrap to two tight rows, which is what 'leading-3.5' fits in the row's 'h-7';
             a third row is cut off, so the card keeps its height. A compact row has no footer: the wrapper
             steps aside ('contents') and the actions join the end of the single row. -->
        <div
            v-if="isCompact ? actions.length > 0 : badges.length > 0 || actions.length > 0"
            :class="isCompact ? 'contents' : 'flex h-7 flex-none items-center gap-x-3 pointer-coarse:h-8.5'"
        >
            <ul v-if="!isCompact && badges.length > 0" class="flex max-h-7 min-w-0 flex-1 flex-wrap items-center gap-x-3 overflow-hidden text-xs leading-3.5 whitespace-nowrap text-muted pointer-coarse:max-h-8.5">
                <li v-for="badge in badges" :key="badge.id" class="flex flex-none items-center gap-x-1.5">
                    <span aria-hidden="true" class="size-2 rounded-full" :class="BADGE_DOT_CLASSES[badge.color ?? 'neutral']" />
                    {{ badge.label }}
                </li>
            </ul>

            <!-- Actions, raised above the card-activation button by stacking order rather than nested inside it, so each
                 keeps its own click instead of the card's. -->
            <div v-if="actions.length > 0" class="relative z-20 ml-auto flex flex-none items-center gap-x-1">
                <template v-for="action in actions" :key="action.typeId">
                    <ActionWrapper v-if="action.typeId === 'delete'" :aria-label="action.label ?? 'Delete'" :class="ROUND_ACTION_CLASSES" @click="action.onClick(config)">
                        <TrashIcon aria-hidden="true" class="size-4 pointer-coarse:size-5" :stroke-width="1.25" />
                    </ActionWrapper>

                    <!-- The same pill as the open button at the foot of the detail panel, because it does the same thing. With
                         a status, it holds the status too, since opening is what takes the user to it. On a selected card,
                         whose tint matches the pill's, it turns white so it still stands out. -->
                    <ActionWrapper
                        v-if="action.typeId === 'open'"
                        :aria-label="action.label ?? 'Open'"
                        class="flex h-7 items-center justify-center gap-x-1.5 shadow-xs pointer-coarse:h-8.5"
                        :class="[PILL_CLASSES, selected ? 'bg-surface hover:bg-selected' : PILL_FILL_CLASSES, $slots.status && !isCompact ? 'pr-1.5 pl-2' : 'w-7 pointer-coarse:w-8.5']"
                        :title="$slots.status && !isCompact ? action.label : undefined"
                        @click="action.onClick(config)"
                    >
                        <slot v-if="!isCompact" name="status" />
                        <ArrowRightIcon aria-hidden="true" class="size-4 pointer-coarse:size-5" :stroke-width="1.25" />
                    </ActionWrapper>

                    <ActionWrapper v-if="action.typeId === 'info'" :aria-label="action.label ?? 'Information'" :class="ROUND_ACTION_CLASSES" @click="action.onClick(config)">
                        <InfoIcon aria-hidden="true" class="size-4 pointer-coarse:size-5" :stroke-width="1.25" />
                    </ActionWrapper>
                </template>
            </div>
        </div>
    </div>
</template>
