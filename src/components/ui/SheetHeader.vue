<script setup lang="ts">
// The top of a sheet that slides up over the foot of a narrow screen: a handle that drags the sheet between its heights,
// or steps it to the next one when clicked, and a close button. What the caller puts in it goes under the handle.

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

const { isFull } = defineProps<{
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
    <div ref="header" class="flex-none touch-none! select-none" data-region="SheetHeader">
        <!-- Handle ─ The left padding matches the close button's width, so the bar sits in the middle of the sheet. -->
        <div class="flex items-center pr-3 pl-11.5">
            <ActionWrapper
                :aria-label="t(TEXT, isFull ? 'handle.collapse.aria' : 'handle.expand.aria')"
                class="flex h-9 flex-1 cursor-grab items-center justify-center"
                @click="handleStep"
            >
                <span class="h-1 w-9 rounded-full bg-muted/50" />
            </ActionWrapper>
            <CloseButton :accessible-label="t(TEXT, 'close.aria')" @click="handleClose" />
        </div>

        <slot />
    </div>
</template>
