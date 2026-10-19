<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';
import { useElementSize } from '@vueuse/core';
import { computed, inject, ref, useTemplateRef } from 'vue';

// ── Local Framework
import { gridDetailIsSplitKey } from '@/components/ui/grid/gridDetail';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { icon, iconDark, overline, title } = defineProps<{ icon?: string | null; iconDark?: string | null; overline?: string; title: string }>();

defineSlots<{
    actions?(): unknown; // Rendered at the right of the title row.
    default?(): unknown; // Rendered below the header and tags.
    tags?(): unknown; // Rendered as a wrapping row below the header.
}>();

defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const actionsElement = useTemplateRef<HTMLElement>('actionsElement');
const panesAreSplit = inject(gridDetailIsSplitKey, ref(false));

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const iconIsPresent = computed(() => [icon, iconDark].some((svg) => svg != null && svg !== ''));
const { width: actionsWidth } = useElementSize(actionsElement);
const headerMarginRight = computed(() => `${String(Math.max(42, actionsWidth.value + 14))}px`); // Keeps the title clear of however many actions there are, and of the 6px the actions sit in from the edge.
</script>

<template>
    <div class="dpuse-prose relative pt-4 [&_ul]:list-none [&_ul]:pl-0" data-region="StudioDocumentPanel">
        <!-- Header -->
        <div class="relative">
            <ActionWrapper class="group block w-full min-w-0 cursor-pointer text-left" :class="{ 'pointer-events-none': panesAreSplit }" @click="$emit('close')">
                <!-- Overline with optional back icon. -->
                <div class="flex min-w-0 items-center gap-x-0.5 text-sm leading-tight text-muted group-hover:text-blue-500" :style="{ marginRight: headerMarginRight }">
                    <ArrowLeftIcon v-if="!panesAreSplit" class="size-4 flex-none" />
                    <span class="min-w-0 truncate">{{ overline }} </span>
                </div>

                <!-- Icon/Title -->
                <div class="flex min-w-0 items-start gap-x-2" :style="{ marginRight: headerMarginRight }">
                    <!-- One title line tall, so the icon centres on the first line however the title wraps. -->
                    <div v-if="iconIsPresent" class="flex h-10 flex-none items-center">
                        <ConfigIcon class="h-7" :icon="icon" :icon-dark="iconDark" />
                    </div>
                    <!-- Without an icon, the title moves up by the space above the icon, so it sits as close to the overline
                         as the icon would. Only the top changes, so the actions stay level with the title. -->
                    <h1 class="min-w-0 pb-1 text-left leading-8 wrap-break-word whitespace-normal" :class="iconIsPresent ? 'pt-1' : '-mt-0.5'">
                        {{ title }}
                    </h1>
                </div>
            </ActionWrapper>

            <!-- Actions ─ Beside the header button rather than inside it, because a button may not contain buttons. They sit in
                 the right margin the header keeps clear, and are centred on the title row whatever the overline's height.
                 'right-1.5' puts the last action's centre under the assistant toggle's in the top right corner. -->
            <div v-if="$slots.actions" ref="actionsElement" class="absolute right-1.5 bottom-0 flex h-10 items-center gap-x-2">
                <slot name="actions" />
            </div>
        </div>

        <!-- Tags -->
        <div v-if="$slots.tags" class="mt-3 mb-6 flex flex-wrap gap-1.5">
            <slot name="tags" />
        </div>

        <!-- Content -->
        <slot />
    </div>
</template>
