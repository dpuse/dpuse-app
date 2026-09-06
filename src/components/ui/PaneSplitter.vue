<script setup lang="ts">
// Vertical divider between the two app panes. The model value is the left pane's width as a percentage of the row
// holding both panes. It can be dragged with the pointer, nudged with the arrow keys, or double-clicked to toggle
// between an even split and a wider left pane.

// ── External Dependencies & Registrations
import { onMounted, onUnmounted, ref, shallowRef } from 'vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const BALANCED_PERCENT = 50; // Even split — the default, and one half of the double-click toggle.
const EXPANDED_PERCENT = 75; // Left pane favoured — the other half of the double-click toggle.
const GRIP_DOT_COUNT = 3;
const KEYBOARD_STEP_PERCENT = 1;
const KEYBOARD_STEP_PERCENT_LARGE = 10;
const MAXIMUM_PERCENT = 80;
const MINIMUM_PERCENT = 20;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Model
const splitterLeftPanePercent = defineModel<number>({ default: BALANCED_PERCENT });

// Drag — only meaningful while a drag is in progress. Refs rather than plain variables because the lint rules forbid
// reassigning a top-level variable from inside a function.
const previousBodyUserSelect = ref(''); // Text selection is switched off page-wide while dragging; this restores it.
const splitterContainerRect = shallowRef<DOMRect>(); // The row holding both panes, measured once as the drag starts.
const splitterIsDragging = ref(false);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    // A caller can hand over a percentage from outside its own control — 'App.vue' restores the last split from local
    // storage, which a stale key or a hand edit can put out of range. The bounds are defined here, so the correction
    // belongs here too: every other way the value moves is already clamped, and this closes the one way in that is not.
    splitterLeftPanePercent.value = clampPercent(splitterLeftPanePercent.value);
});

onUnmounted(() => {
    // Safety net only. A drag holds the pointer, so nothing should be able to remove the splitter before it ends, but
    // if that ever happened the page would be left unselectable.
    endDrag();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleDoubleClick(): void {
    splitterLeftPanePercent.value = splitterLeftPanePercent.value === BALANCED_PERCENT ? EXPANDED_PERCENT : BALANCED_PERCENT;
}

function handleKeyDown(event: KeyboardEvent): void {
    const step = event.shiftKey ? KEYBOARD_STEP_PERCENT_LARGE : KEYBOARD_STEP_PERCENT;
    let nextPercent: number;
    switch (event.key) {
        case 'ArrowLeft':
            nextPercent = splitterLeftPanePercent.value - step;
            break;
        case 'ArrowRight':
            nextPercent = splitterLeftPanePercent.value + step;
            break;
        case 'End':
            nextPercent = MAXIMUM_PERCENT;
            break;
        case 'Home':
            nextPercent = MINIMUM_PERCENT;
            break;
        default:
            return;
    }
    event.preventDefault();
    splitterLeftPanePercent.value = clampPercent(nextPercent);
}

function handlePointerCancel(): void {
    endDrag();
}

function handlePointerDown(event: PointerEvent): void {
    const splitter = event.currentTarget as HTMLElement;
    // The pane percentage is relative to the layout row, which is inset from the viewport by the safe areas.
    splitterContainerRect.value = (splitter.parentElement ?? splitter).getBoundingClientRect();
    previousBodyUserSelect.value = document.body.style.userSelect;
    document.body.style.userSelect = 'none';
    splitterIsDragging.value = true;
    splitter.setPointerCapture(event.pointerId);
}

function handlePointerMove(event: PointerEvent): void {
    const containerRect = splitterContainerRect.value;
    if (containerRect === undefined || !splitterIsDragging.value) return;
    const percent = ((event.clientX - containerRect.left) / containerRect.width) * 100;
    splitterLeftPanePercent.value = clampPercent(percent);
}

function handlePointerUp(): void {
    endDrag();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function clampPercent(percent: number): number {
    return Math.min(Math.max(percent, MINIMUM_PERCENT), MAXIMUM_PERCENT);
}

function endDrag(): void {
    if (!splitterIsDragging.value) return;

    splitterIsDragging.value = false;
    splitterContainerRect.value = undefined;
    document.body.style.userSelect = previousBodyUserSelect.value;
}
</script>

<template>
    <div
        :aria-valuemax="MAXIMUM_PERCENT"
        :aria-valuemin="MINIMUM_PERCENT"
        :aria-valuenow="Math.round(splitterLeftPanePercent)"
        :class="[
            'group relative z-10 h-full w-(--pane-splitter-width) flex-none cursor-col-resize touch-none border-x border-boundary transition-colors',
            'hover:bg-separator focus-visible:bg-separator focus-visible:outline-none',
            splitterIsDragging && 'bg-separator'
        ]"
        aria-label="Resize panes"
        aria-orientation="vertical"
        data-region="PaneSplitter"
        role="separator"
        tabIndex="0"
        @dblclick="handleDoubleClick"
        @keydown="handleKeyDown"
        @pointercancel="handlePointerCancel"
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerup="handlePointerUp"
    >
        <!--
          The root is an ARIA window splitter: 'separator' plus a tab stop, which is what makes arrow keys expected here.
          -->

        <!-- Widens the grab area equally over both panes without affecting layout. The parent's z-index keeps it above
             them. A splitter's width on each side, so the target is three times what is drawn — a size chosen for the
             pointer rather than tied to the divider, which is why it repeats the value instead of sharing it. -->
        <div class="absolute -inset-x-(--pane-splitter-width) inset-y-0" />

        <div class="pointer-events-none absolute top-1/2 left-1/2 flex -translate-1/2 flex-col gap-0.75">
            <span
                v-for="dot in GRIP_DOT_COUNT"
                :key="dot"
                :class="['size-0.75 rounded-full transition-colors', splitterIsDragging ? 'bg-subtle' : 'bg-boundary-hover group-hover:bg-subtle group-focus-visible:bg-subtle']"
            />
        </div>
    </div>
</template>
