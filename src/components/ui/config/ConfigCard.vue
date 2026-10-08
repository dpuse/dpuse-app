<script setup lang="ts" generic="T extends BaseConfig = BaseConfig">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';
import { useId } from 'vue';
import { ArrowRightIcon, FunnelIcon, InfoIcon, TrashIcon } from '@lucide/vue';

// ── DPUse Framework
import type { BaseConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { Action } from './configCard';
import { t } from '@/state/locale';
import { TEXT } from './ConfigCard_.json';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A card's actions are neutral and flat: a grey border, their own white fill so they hold up on a hovered or selected
// card, and a darker fill on hover. No shadow and no blue fill, both kept for the page's floating primary action, so
// an action on one item never competes with it. 28px with a mouse, 34px on touch.
const ACTION_CLASSES =
    'flex h-7 items-center justify-center rounded-full border border-zinc-300 bg-surface hover:bg-zinc-100 pointer-coarse:h-8.5 dark:border-zinc-600 dark:hover:bg-zinc-800';
const ROUND_ACTION_CLASSES = `${ACTION_CLASSES} w-7 pointer-coarse:w-8.5`;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties<T extends BaseConfig> {
    actions?: Action<T>[];
    categoryLabel?: string; // Bottom left, as muted text: what kind of thing the card is, for scanning and filtering.
    config: LocalisedConfig<T>;
    icon?: null | string; // Replaces the config's own icon, e.g. with that of the connector behind it.
    iconDark?: null | string;
    isCompact?: boolean;
    onCategoryClick?: (config: LocalisedConfig<T>) => void; // Declared as a prop so the card can tell whether '@category-click' is bound.
    overline?: string; // Above the label, e.g. the kind of thing the card is: it is read before the name it classifies.
    prereleaseLabel?: string; // Top right, as a small amber tag, e.g. 'Beta': a caution about the version.
    selected?: boolean;
    to?: RouteLocationRaw;
}
const { actions = [], categoryLabel, config, icon, iconDark, isCompact, onCategoryClick, overline, prereleaseLabel, selected, to } = defineProps<Properties<T>>();

defineSlots<{ status?: () => unknown }>(); // Small and quiet, at the end of the overline, e.g. progress dots.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const cardId = useId(); // Prefixes the ids of the actions' descriptions, which must be unique on the page.

// Listeners like '@click' from the host land on the card-activation button below rather than on the root, which
// carries no interactive semantics of its own.
defineOptions({ inheritAttrs: false });
</script>

<template>
    <!-- A full-size card is a fixed height, so every card in a virtualised grid row matches: a title row, then a footer
         row of category and actions, each 'h-7' in 'p-3' with a 'gap-y-3' between; an overline grows the title row to 'h-9' to fit its
         second line. 'useCardRowHeight' in './configCard' states the same numbers. Compact is a single plain list row. -->
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
        <ActionWrapper :aria-label="overline ? `${overline}: ${config.label}` : config.label" class="absolute inset-0 z-10" :title="config.label" :to="to" v-bind="$attrs" />

        <!-- Header - One line only: the label truncates rather than wraps, because the card cannot grow. -->
        <div class="flex min-w-0 items-center gap-x-2" :class="isCompact ? 'flex-1' : overline ? 'h-9 flex-none' : 'h-7 flex-none'">
            <!-- Icon -->
            <ConfigIcon :class="isCompact ? 'size-5' : 'size-7'" :icon="icon ?? config.icon" :icon-dark="iconDark ?? config.iconDark" />

            <div class="flex min-w-0 flex-col">
                <!-- Overline, with the status after it on the same line so it adds no height. -->
                <div v-if="!isCompact && overline" class="flex min-w-0 items-center gap-x-1.5 text-xs leading-tight text-muted">
                    <span class="min-w-0 truncate">{{ overline }}</span>
                    <slot name="status" />
                </div>

                <!-- Label -->
                <div class="min-w-0 truncate leading-tight text-muted">{{ config.label }}</div>
            </div>

            <!-- Pre-release tag - Square-cornered and small, so it reads as a label rather than a button. Short, so it
                 takes little from the title beside it. -->
            <span
                v-if="!isCompact && prereleaseLabel"
                class="ml-auto flex-none self-start rounded-sm bg-warning px-1.5 py-0.5 text-[11px] leading-none font-medium tracking-wide text-warning-text uppercase"
            >
                {{ prereleaseLabel }}
            </span>
        </div>

        <!-- Footer - The category on the left and the actions on the right. A compact row has no footer: the wrapper steps
             aside ('contents') and the actions join the end of the single row. -->
        <div
            v-if="isCompact ? actions.length > 0 : categoryLabel || actions.length > 0"
            :class="isCompact ? 'contents' : 'flex h-7 flex-none items-center gap-x-3 pointer-coarse:h-8.5'"
        >
            <!-- Category - Muted text, so it stays below the title in weight. When the host can filter by it, a pill: the
                 actions' round shape but shorter, with a lighter border and no fill, so it reads as a button without
                 outranking them. The border stays at rest because touch has no hover to reveal it. On hover it takes the
                 actions' border and fill and shows a funnel. -->
            <template v-if="!isCompact && categoryLabel">
                <ActionWrapper
                    v-if="onCategoryClick"
                    :aria-label="t(TEXT, 'filterByCategory.label', { category: categoryLabel })"
                    class="group relative z-20 flex h-6 min-w-0 items-center gap-x-1 rounded-full border border-zinc-200 px-2 text-xs text-muted hover:border-zinc-300 hover:bg-zinc-100 hover:text-content dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                    :title="t(TEXT, 'filterByCategory.label', { category: categoryLabel })"
                    @click="onCategoryClick(config)"
                >
                    <span class="truncate">{{ categoryLabel }}</span>
                    <FunnelIcon aria-hidden="true" class="hidden size-3 flex-none group-hover:block group-focus-visible:block" :stroke-width="1.5" />
                </ActionWrapper>
                <span v-else class="min-w-0 truncate text-xs text-muted">{{ categoryLabel }}</span>
            </template>

            <!-- Actions, raised above the card-activation button by stacking order rather than nested inside it, so each
                 keeps its own click instead of the card's. -->
            <div v-if="actions.length > 0" class="relative z-20 ml-auto flex flex-none items-center gap-x-1">
                <template v-for="action in actions" :key="action.typeId">
                    <ActionWrapper
                        v-if="action.typeId === 'delete'"
                        :aria-describedby="action.description ? `${cardId}-${action.typeId}` : undefined"
                        :aria-label="action.label ?? 'Delete'"
                        :class="ROUND_ACTION_CLASSES"
                        @click="action.onClick(config)"
                    >
                        <TrashIcon aria-hidden="true" class="size-4 pointer-coarse:size-5" :stroke-width="1.25" />
                    </ActionWrapper>

                    <!-- Open, ending in the same arrow as the open button at the foot of the detail panel, because it does the
                         same thing; neutral rather than blue, because it ranks below the page's own action. -->
                    <ActionWrapper
                        v-if="action.typeId === 'open'"
                        :aria-describedby="action.description ? `${cardId}-${action.typeId}` : undefined"
                        :aria-label="action.label ?? 'Open'"
                        :class="ROUND_ACTION_CLASSES"
                        @click="action.onClick(config)"
                    >
                        <ArrowRightIcon aria-hidden="true" class="size-4 text-accent pointer-coarse:size-5" :stroke-width="2" />
                    </ActionWrapper>

                    <ActionWrapper
                        v-if="action.typeId === 'info'"
                        :aria-describedby="action.description ? `${cardId}-${action.typeId}` : undefined"
                        :aria-label="action.label ?? 'Information'"
                        :class="ROUND_ACTION_CLASSES"
                        @click="action.onClick(config)"
                    >
                        <InfoIcon aria-hidden="true" class="size-4 pointer-coarse:size-5" :stroke-width="1.25" />
                    </ActionWrapper>
                </template>

                <!-- Descriptions for 'aria-describedby', which must point at an element in the page. -->
                <template v-for="action in actions" :key="`${action.typeId}-description`">
                    <span v-if="action.description" :id="`${cardId}-${action.typeId}`" class="sr-only">{{ action.description }}</span>
                </template>
            </div>
        </div>
    </div>
</template>
