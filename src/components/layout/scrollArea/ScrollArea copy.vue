<script setup lang="ts">
import 'overlayscrollbars/overlayscrollbars.css';
import type { OverlayScrollbars } from 'overlayscrollbars';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
import { onMounted, onUnmounted, ref, watch, nextTick } from 'vue';

import { contentScrollPosition, isDarkMode, knowledgePaneIsVisible } from '@/state/appLayout';

// ─────────────────────────────────────────────────────────────────────────────

type Properties = {
    autoHide?: 'scroll' | 'never' | 'move' | 'leave';
    autoHideSuspend?: boolean;
    rowCount?: number;
    scrollAreaInset?: 'embedded' | 'screen';
};

const { autoHideSuspend = false, rowCount = 0, scrollAreaInset } = defineProps<Properties>();

const emit = defineEmits<{
    initialised: [ScrollbarElements: HTMLElement];
}>();

// ─────────────────────────────────────────────────────────────────────────────
// State

const osRef = ref<any>(null);

let scrollElement: HTMLElement | null = null;
let osHandleElement: HTMLElement | null = null;

const isDragging = ref(false);
const currentRow = ref(1);
const labelOffsetY = ref(0);

const resetKey = ref(0);

// ─────────────────────────────────────────────────────────────────────────────
// iOS SAFARI FIX: hard reset lifecycle

function hardReset() {
    const instance: OverlayScrollbars | undefined = osRef.value?.osInstance?.();

    if (!instance) return;

    instance.destroy();

    scrollElement = null;
    osHandleElement = null;

    resetKey.value++;
}

// Detect iOS Safari + reload restore
function bindIOSLifecycleFix() {
    window.addEventListener('pageshow', (e: PageTransitionEvent) => {
        if (e.persisted) {
            hardReset();
        }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle

onMounted(() => {
    bindIOSLifecycleFix();
});

onUnmounted(() => {
    osHandleElement?.removeEventListener('pointerdown', onHandlePointerDown);
    document.removeEventListener('pointerup', onDocumentPointerUp);
    scrollElement?.removeEventListener('scroll', onViewportScroll);
});

// ─────────────────────────────────────────────────────────────────────────────
// OverlayScrollbars init

function handleInitialised(instance: OverlayScrollbars): void {
    const { viewport, scrollbarVertical } = instance.elements();

    scrollElement = viewport;
    osHandleElement = scrollbarVertical.handle;

    osHandleElement.addEventListener('pointerdown', onHandlePointerDown);
    document.addEventListener('pointerup', onDocumentPointerUp);
    viewport.addEventListener('scroll', onViewportScroll, { passive: true });

    // 🔧 CRITICAL FIX: reset internal handle geometry state
    const handle = scrollbarVertical.handle as HTMLElement;

    handle.style.transform = '';
    handle.style.height = '';

    // force recompute AFTER iOS layout restore
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            instance.update(); // ⚠️ NOT update(true)
        });
    });

    emit('initialised', scrollElement);
}

// ─────────────────────────────────────────────────────────────────────────────
// Handlers

function onHandlePointerDown(): void {
    isDragging.value = true;
}

function onDocumentPointerUp(): void {
    isDragging.value = false;
}

function onViewportScroll(): void {
    const el = scrollElement;
    if (!el) return;

    if (knowledgePaneIsVisible.value) {
        contentScrollPosition.value = el.scrollTop;
    }

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;

    const ratio = el.scrollTop / maxScroll;

    currentRow.value = Math.max(1, Math.round(ratio * rowCount));
    labelOffsetY.value = ratio * (el.clientHeight - 40) + 20;
}
</script>

<template>
    <div class="relative h-full min-h-0 min-w-0">
        <OverlayScrollbarsComponent
            :key="resetKey"
            ref="osRef"
            class="h-full"
            :class="scrollAreaInset"
            defer
            :options="{
                scrollbars: {
                    autoHide: 'never',
                    autoHideDelay: 750,
                    autoHideSuspend,
                    dragScroll: true,
                    theme: isDarkMode ? 'os-theme-light' : 'os-theme-dark',
                    visibility: 'auto'
                }
            }"
            @os-initialized="handleInitialised"
        >
            <slot />
        </OverlayScrollbarsComponent>

        <div
            v-if="isDragging && rowCount > 0"
            class="pointer-events-none absolute right-14 z-20 rounded-full bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-zinc-50 select-none dark:bg-zinc-200 dark:text-zinc-800"
            :style="{ top: labelOffsetY + 'px', transform: 'translateY(-50%)' }"
        >
            {{ currentRow.toLocaleString() }}
        </div>
    </div>
</template>

<style scoped>
/* Disable overscroll. */
:deep([data-overlayscrollbars-viewport]) {
    overscroll-behavior: none;
}

:deep(.embedded) {
    padding-top: 8px;
    padding-bottom: var(--vertical-scroll-bottom-embedded-inset);
    .os-scrollbar-vertical {
        bottom: calc(var(--spacing-vertical-scroll-bottom-embedded-inset));
    }
}

:deep(.screen) {
    padding-top: 16px;
    padding-bottom: var(--vertical-scroll-bottom-screen-inset);
    .os-scrollbar-vertical {
        bottom: calc(var(--spacing-vertical-scroll-bottom-screen-inset));
        .os-scrollbar-track {
            /* inset: 0 0 48px 0; */
            background: red;
            .os-scrollbar-handle {
                background: blue;
            }
        }
    }
}
</style>
