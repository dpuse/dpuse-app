<script setup lang="ts">
// The top of a sheet that slides up over the foot of a narrow screen: a handle that drags the sheet between its heights,
// or steps it to the next one when clicked, and a close button. The handle and the close button float over the top of
// the sheet rather than taking a row of their own, so the content starts at the top. What the caller puts in it sits
// in the flow, and must leave room at its top for them.

// ── External Dependencies & Registrations
import { usePointerSwipe } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './SheetHeader_.json';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import CloseButton from '@/components/ui/action/CloseButton.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DRAG_THRESHOLD_PX = 5; // A pointer that moves less than this is a click on the handle or the close button, not a drag.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isContentScrolled, isFull } = defineProps<{
    isContentScrolled?: boolean; // The sheet's content is scrolled down, so it passes under the close button.
    isFull: boolean; // The sheet can go no higher, so the handle offers to lower it.
}>();

defineSlots<{ default?(): unknown }>();

// 'distance' is how far up the pointer has moved since it went down, in pixels. It is negative when the pointer has
// moved down.
const emit = defineEmits<{ close: []; drag: [distance: number]; dragEnd: [distance: number]; step: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const headerElement = useTemplateRef<HTMLDivElement>('header');
const wasDragged = ref(false); // A drag that ends over the handle or the close button is followed by a click, which must not also step or close the sheet.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

const { distanceY } = usePointerSwipe(headerElement, {
    threshold: DRAG_THRESHOLD_PX,
    onSwipeStart: () => {
        wasDragged.value = false;
    },
    onSwipe: () => {
        emit('drag', distanceY.value);
    },
    onSwipeEnd: () => {
        wasDragged.value = true;
        emit('dragEnd', distanceY.value);
    }
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleStep(): void {
    if (!wasDragged.value) emit('step');
    wasDragged.value = false;
}

function handleClose(): void {
    if (!wasDragged.value) emit('close');
    wasDragged.value = false;
}
</script>

<template>
    <!-- 'touch-none!' overrides the 'touch-action: pan-y' that 'usePointerSwipe' sets on the element, which hands every
         vertical touch drag to the browser to scroll with, so the sheet would never follow a finger. -->
    <div ref="header" class="relative flex-none touch-none! select-none" data-region="SheetHeader">
        <!-- Handle ─ The left padding matches the close button's width and its right inset, so the bar sits in the middle of
             the sheet. The close button is inset 12px from the top and the side, which keeps it clear of the sheet's
             rounded corner and centres it 30px in, over the actions on a document's title row below it. -->
        <div class="absolute inset-x-0 top-0 z-10 flex items-start pr-3 pl-12">
            <ActionWrapper
                :aria-label="t(TEXT, isFull ? 'handle.collapse.aria' : 'handle.expand.aria')"
                class="flex h-9 flex-1 cursor-grab items-center justify-center"
                @click="handleStep"
            >
                <span class="h-1 w-9 rounded-full bg-muted/50" />
            </ActionWrapper>
            <!-- Close Button ─ Over scrolled content it takes the look of a neutral control that floats over content, white
                 with a border and a shadow, as the session button has, so the content passing under it never runs into its
                 ✕. Not the colour of a pill, because closing is not the page's main action. At the top of the content it
                 needs none of it. The border is always there, clear until it shows, so the button never changes size. -->
            <CloseButton
                :accessible-label="t(TEXT, 'close.aria')"
                class="mt-3 border transition-[background-color,border-color,box-shadow] duration-200"
                :class="isContentScrolled ? 'border-separator bg-surface shadow-md' : 'border-transparent'"
                @click="handleClose"
            />
        </div>

        <slot />
    </div>
</template>
