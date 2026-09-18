<script setup lang="ts">
// Vertical divider between the two app panes. The model value is the left pane's width as a percentage of the row
// holding both panes. It can be dragged with the pointer, nudged with the arrow keys, or double-clicked to toggle
// between an even split and a wider left pane. A pill of two arrows at the top steps it between preset widths.

// ── External Dependencies & Registrations
import { ChevronLeftIcon, ChevronRightIcon } from '@lucide/vue';
import { computed, onMounted, onUnmounted, ref, shallowRef } from 'vue';

import { t } from '@/state/locale';
import { TEXT } from './PaneSplitter_.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const BALANCED_PERCENT = 50; // Even split — the default, and one half of the double-click toggle.
const EXPANDED_PERCENT = 75; // Left pane favoured — the other half of the double-click toggle.
const GRIP_DOT_COUNT = 3;
const KEYBOARD_STEP_PERCENT = 1;
const KEYBOARD_STEP_PERCENT_LARGE = 10;
const MAXIMUM_PERCENT = 80;
const MINIMUM_PERCENT = 20;
const PRESET_PERCENTS = [25, 50, 75]; // Ascending — the pill arrows step through these.
const PRESET_TOLERANCE_PERCENT = 0.5; // A drag rarely lands exactly on a preset; this close counts as on it.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Model
const splitterLeftPanePercent = defineModel<number>({ default: BALANCED_PERCENT });

// Drag — only meaningful while a drag is in progress. Refs rather than plain variables because the lint rules forbid
// reassigning a top-level variable from inside a function.
const previousBodyUserSelect = ref(''); // Text selection is switched off page-wide while dragging; this restores it.
const previousBodyWebkitUserSelect = ref(''); // Safari, including every iPad browser, only honours the prefixed form.
const splitterContainerRect = shallowRef<DOMRect>(); // The row holding both panes, measured once as the drag starts.
const splitterIsDragging = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const nextPresetPercent = computed(() => PRESET_PERCENTS.find((percent) => percent > splitterLeftPanePercent.value + PRESET_TOLERANCE_PERCENT));
const previousPresetPercent = computed(() => PRESET_PERCENTS.findLast((percent) => percent < splitterLeftPanePercent.value - PRESET_TOLERANCE_PERCENT));

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

function handleMoveLeft(): void {
    if (previousPresetPercent.value !== undefined) splitterLeftPanePercent.value = previousPresetPercent.value;
}

function handleMoveRight(): void {
    if (nextPresetPercent.value !== undefined) splitterLeftPanePercent.value = nextPresetPercent.value;
}

function handlePointerCancel(): void {
    endDrag();
}

function handlePointerDown(event: PointerEvent): void {
    const splitter = event.currentTarget as HTMLElement;
    // The pane percentage is relative to the layout row, which is inset from the viewport by the safe areas. The row is
    // two levels up, because the component's root wraps the separator.
    splitterContainerRect.value = (splitter.parentElement?.parentElement ?? splitter).getBoundingClientRect();
    previousBodyUserSelect.value = document.body.style.userSelect;
    previousBodyWebkitUserSelect.value = document.body.style.getPropertyValue('-webkit-user-select');
    document.body.style.userSelect = 'none';
    document.body.style.setProperty('-webkit-user-select', 'none');
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
    document.body.style.setProperty('-webkit-user-select', previousBodyWebkitUserSelect.value);
}
</script>

<template>
    <!-- The pill sits beside the separator rather than inside it, so its buttons are not nested in another control and
         pressing one does not start a drag. -->
    <div class="group/splitter relative z-10 flex w-(--pane-splitter-width) flex-none self-stretch" data-region="PaneSplitter">
        <!--
          An ARIA window splitter: 'separator' plus a tab stop, which is what makes arrow keys expected here.
          'select-none' stops a touch press-and-hold selecting text before the drag starts; the page-wide switch only
          takes over once 'pointerdown' fires.
          -->
        <div
            :aria-label="t(TEXT, 'splitter.aria')"
            :aria-valuemax="MAXIMUM_PERCENT"
            :aria-valuemin="MINIMUM_PERCENT"
            :aria-valuenow="Math.round(splitterLeftPanePercent)"
            :class="[
                'group relative flex-1 cursor-col-resize touch-none border-x border-boundary transition-colors select-none',
                // The handle is a few pixels wide, so it shows focus by lighting up rather than by being ringed. 'outline-hidden'
                // rather than 'outline-none': in Tailwind v4 the former keeps an outline in forced-colors mode, where this
                // background change is not rendered and would otherwise leave no indicator at all.
                'hover:bg-separator focus-visible:bg-separator focus-visible:outline-hidden',
                splitterIsDragging && 'bg-separator'
            ]"
            aria-orientation="vertical"
            role="separator"
            tabIndex="0"
            @dblclick="handleDoubleClick"
            @keydown="handleKeyDown"
            @pointercancel="handlePointerCancel"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
        >
            <!-- Widens the grab area equally over both panes without affecting layout. The root's z-index keeps it above
                 them. A splitter's width on each side, so the target is three times what is drawn — a size chosen for the
                 pointer rather than tied to the divider, which is why it repeats the value instead of sharing it. On touch
                 screens a fingertip needs more, so it fills the 16px gutter each side, close to Apple's 44pt minimum. -->
            <div class="absolute -inset-x-(--pane-splitter-width) inset-y-0 pointer-coarse:-inset-x-4" />

            <div class="pointer-events-none absolute top-1/2 left-1/2 flex -translate-1/2 flex-col gap-0.75">
                <span
                    v-for="dot in GRIP_DOT_COUNT"
                    :key="dot"
                    :class="[
                        'size-0.75 rounded-full transition-colors',
                        splitterIsDragging ? 'bg-subtle' : 'bg-boundary-hover group-hover:bg-subtle group-focus-visible:bg-subtle'
                    ]"
                />
            </div>
        </div>

        <!-- Centred on the line below the 55px pane headers, so it clears their titles. Hidden pills ignore the pointer, so
             they cannot be clicked unseen; touch has no hover to reveal them, so there they always show, with buttons
             padded to 32px for a fingertip. -->
        <div
            class="pointer-events-none absolute top-14 left-1/2 flex -translate-1/2 rounded-full border border-boundary bg-surface p-0.5 opacity-0 transition-opacity group-focus-within/splitter:pointer-events-auto group-focus-within/splitter:opacity-100 group-hover/splitter:pointer-events-auto group-hover/splitter:opacity-100 pointer-coarse:pointer-events-auto pointer-coarse:opacity-100"
        >
            <button
                :aria-label="t(TEXT, 'moveLeft.aria')"
                :disabled="previousPresetPercent === undefined"
                class="rounded-full text-content hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-zinc-300/25 pointer-coarse:p-2"
                type="button"
                @click="handleMoveLeft"
            >
                <ChevronLeftIcon class="size-4" />
            </button>
            <button
                :aria-label="t(TEXT, 'moveRight.aria')"
                :disabled="nextPresetPercent === undefined"
                class="rounded-full text-content hover:bg-zinc-100 disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-zinc-300/25 pointer-coarse:p-2"
                type="button"
                @click="handleMoveRight"
            >
                <ChevronRightIcon class="size-4" />
            </button>
        </div>
    </div>
</template>
