<script lang="ts">
// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Shared by every tooltip on the page, so only one is open at a time, and moving from one trigger to the next opens the
// next at once rather than after the delay again.
const openTooltip: { close: (() => void) | undefined; closedAt: number } = { close: undefined, closedAt: 0 };
</script>

<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, type CSSProperties, nextTick, ref, useId, useTemplateRef } from 'vue';
import { useEventListener, useTimeoutFn } from '@vueuse/core';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SHOW_DELAY_MS = 300; // Long enough that a pointer passing over a trigger opens nothing.
const HIDE_DELAY_MS = 100; // Time to cross the gap from the trigger onto the tooltip, which stays open while pointed at.
const WARM_PERIOD_MS = 500; // How soon after one tooltip closes the next opens without the delay.
const TRIGGER_GAP_PX = 6;
const VIEWPORT_MARGIN_PX = 8; // Keeps the tooltip clear of the window's edges.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { text } = defineProps<{
    text?: string; // Plain text. The 'content' slot takes its place for text with more than one part.
}>();

const slots = defineSlots<{
    content?(): unknown;
    default(props: { triggerAttributes: { 'aria-describedby': string | undefined } }): unknown; // The trigger. A focusable trigger binds 'triggerAttributes', so a screen reader reads the tooltip with it.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const tooltipId = useId();
const wrapperElement = useTemplateRef<HTMLSpanElement>('wrapper');
const tooltipElement = useTemplateRef<HTMLSpanElement>('tooltip');
const isOpen = ref(false);
const tooltipPosition = ref<CSSProperties>({});

const { start: startShowTimer, stop: stopShowTimer } = useTimeoutFn(
    () => {
        void showTooltip();
    },
    SHOW_DELAY_MS,
    { immediate: false }
);
const { start: startHideTimer, stop: stopHideTimer } = useTimeoutFn(
    () => {
        hideTooltip();
    },
    HIDE_DELAY_MS,
    { immediate: false }
);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const triggerAttributes = computed(() => ({ 'aria-describedby': isOpen.value ? tooltipId : undefined }));
const openWindow = computed(() => (isOpen.value ? globalThis : undefined)); // Listeners only while open, so a long list of triggers adds none.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Escape closes the tooltip without moving focus. A scroll closes it, because it stays where it opened and its trigger
// moves away.
useEventListener(openWindow, 'keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') hideTooltip();
});
useEventListener(
    openWindow,
    'scroll',
    () => {
        hideTooltip();
    },
    { capture: true, passive: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// A touch has no hover, so it opens nothing. Soon after another tooltip closes, this one opens at once.
function handleHoverTrigger(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    stopHideTimer();
    if (isOpen.value) return;
    if (Date.now() - openTooltip.closedAt < WARM_PERIOD_MS) void showTooltip();
    else startShowTimer();
}

// The tooltip is inside the wrapper, so pointing at it counts as staying, and it only closes once the pointer leaves both.
function handleLeaveTrigger(): void {
    stopShowTimer();
    if (isOpen.value) startHideTimer();
}

// Keyboard focus opens the tooltip at once. Focus from a click does not, because the pointer's hover already has.
function handleFocusTrigger(event: FocusEvent): void {
    if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) void showTooltip();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function showTooltip(): Promise<void> {
    stopShowTimer();
    if (isOpen.value || ((text ?? '') === '' && slots.content == null)) return; // Nothing to show.
    openTooltip.close?.();
    openTooltip.close = hideTooltip;
    isOpen.value = true;
    await nextTick();
    tooltipElement.value?.showPopover();
    placeTooltip();
}

function hideTooltip(): void {
    stopShowTimer();
    stopHideTimer();
    if (!isOpen.value) return;
    tooltipElement.value?.hidePopover();
    isOpen.value = false;
    openTooltip.closedAt = Date.now();
    if (openTooltip.close === hideTooltip) openTooltip.close = undefined;
}

// Centred above the trigger, or below it when there is no room above, and moved in to stay inside the window.
function placeTooltip(): void {
    const triggerBounds = wrapperElement.value?.firstElementChild?.getBoundingClientRect();
    const tooltip = tooltipElement.value;
    if (triggerBounds == null || tooltip == null) return;
    const { offsetHeight: height, offsetWidth: width } = tooltip;
    const viewportWidth = document.documentElement.clientWidth;
    const left = Math.max(VIEWPORT_MARGIN_PX, Math.min(triggerBounds.left + triggerBounds.width / 2 - width / 2, viewportWidth - VIEWPORT_MARGIN_PX - width));
    const aboveTop = triggerBounds.top - TRIGGER_GAP_PX - height;
    const top = aboveTop >= VIEWPORT_MARGIN_PX ? aboveTop : triggerBounds.bottom + TRIGGER_GAP_PX;
    tooltipPosition.value = { left: `${String(left)}px`, top: `${String(top)}px` };
}
</script>

<template>
    <!-- Wrapper ─ 'contents', so it adds no box and the trigger lays out as if it were not there. -->
    <span
        ref="wrapper"
        class="contents"
        data-region="Tooltip"
        @focusin="handleFocusTrigger"
        @focusout="hideTooltip"
        @pointerenter="handleHoverTrigger"
        @pointerleave="handleLeaveTrigger"
    >
        <slot :trigger-attributes="triggerAttributes" />
        <!-- Tooltip ─ In the top layer, so no pane or table around the trigger can clip it. 'inset-auto m-0' undoes the
             browser's centring of a popover, so the position set from the trigger holds. Rendered only while open, so a
             long list of triggers adds nothing to the page. -->
        <span
            v-if="isOpen"
            :id="tooltipId"
            ref="tooltip"
            class="inset-auto m-0 block max-w-xs rounded-md border border-separator bg-surface px-2 py-1 text-xs text-content shadow-md"
            popover="manual"
            role="tooltip"
            :style="tooltipPosition"
        >
            <slot name="content">{{ text }}</slot>
        </span>
    </span>
</template>
