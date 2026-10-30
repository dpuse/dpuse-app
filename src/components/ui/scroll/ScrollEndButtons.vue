<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ArrowDownIcon, ArrowUpIcon } from '@lucide/vue';
import { usePreferredReducedMotion, useResizeObserver, useScroll } from '@vueuse/core';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './ScrollEndButtons_.json';
import { PILL_CLASSES, PILL_FILL_CLASSES } from '@/components/ui/action/action';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { scrollElement } = defineProps<{
    scrollElement: HTMLElement | undefined; // Undefined until the 'ScrollArea' reports its element.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const reducedMotion = usePreferredReducedMotion();
const scrollBehavior = computed(() => (reducedMotion.value === 'reduce' ? 'auto' : 'smooth'));
const { arrivedState, measure, y: scrollTop } = useScroll(() => scrollElement, { behavior: scrollBehavior });

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Content that grows or shrinks, such as a table being expanded, fires no scroll event, so it would leave the buttons
// out of date. The first measure also comes from here, because the element arrives after this component has mounted.
useResizeObserver(() => (scrollElement ? [scrollElement, ...(scrollElement.children as HTMLCollectionOf<HTMLElement>)] : []), measure);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleScrollToTop(): void {
    scrollTop.value = 0;
}

function handleScrollToBottom(): void {
    if (scrollElement) scrollTop.value = scrollElement.scrollHeight;
}
</script>

<template>
    <div class="flex gap-x-2" data-region="ScrollEndButtons">
        <!-- 'invisible' rather than 'v-if', so each button keeps its place while the other comes and goes. -->
        <ActionWrapper
            :aria-label="t(TEXT, 'top.aria')"
            class="inline-flex size-10 items-center justify-center shadow-md"
            :class="[PILL_CLASSES, PILL_FILL_CLASSES, { invisible: arrivedState.top }]"
            @click="handleScrollToTop"
        >
            <ArrowUpIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
        </ActionWrapper>
        <ActionWrapper
            :aria-label="t(TEXT, 'bottom.aria')"
            class="inline-flex size-10 items-center justify-center shadow-md"
            :class="[PILL_CLASSES, PILL_FILL_CLASSES, { invisible: arrivedState.bottom }]"
            @click="handleScrollToBottom"
        >
            <ArrowDownIcon aria-hidden="true" class="size-5" :stroke-width="1.25" />
        </ActionWrapper>
    </div>
</template>
