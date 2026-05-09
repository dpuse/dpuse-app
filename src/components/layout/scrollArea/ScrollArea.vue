<script setup lang="ts">
// External Dependencies
import 'overlayscrollbars/overlayscrollbars.css';
import { OverlayScrollbars } from 'overlayscrollbars';
// import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

// Local (App) Framework
import { contentScrollPosition, isDarkMode, knowledgePaneIsVisible } from '@/state/appLayout';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

type Properties = { autoHide?: 'scroll' | 'never' | 'move' | 'leave'; autoHideSuspend?: boolean; rowCount?: number; scrollAreaInset?: 'embedded' | 'screen' };
const { autoHide = 'scroll', autoHideSuspend = false, rowCount = 0, scrollAreaInset = 'embedded' } = defineProps<Properties>();

const emit = defineEmits<{ initialised: [ScrollbarElements: HTMLElement] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

let scrollElement: HTMLElement | null = null;
let osHandleElement: Element | null = null;
const isDragging = ref(false);
const currentRow = ref(1);
const labelOffsetY = ref(0);

// Side Effects ────────────────────────────────────────────────────────────────────────────────────────────────────────

const overlayscrollbarsReference = ref();

onMounted(() => {
    OverlayScrollbars(
        overlayscrollbarsReference.value!,
        {
            scrollbars: {
                autoHide: autoHide,
                autoHideDelay: 1300,
                autoHideSuspend: autoHideSuspend,
                dragScroll: true,
                theme: isDarkMode.value ? 'os-theme-light' : 'os-theme-dark',
                visibility: 'auto'
            }
        },
        {
            initialized(instance) {
                console.log('ScrollArea initialised');
                handleInitialised(instance);
            },
            updated() {
                console.log('ScrollArea Updated');
            }
        }
    );
});

// onUnmounted(() => {
//     osHandleElement?.removeEventListener('pointerdown', onHandlePointerDown);
//     document.removeEventListener('pointerup', onDocumentPointerUp);
//     scrollElement?.removeEventListener('scroll', onViewportScroll);
// });

watch(knowledgePaneIsVisible, (visible) => {
    if (!visible) contentScrollPosition.value = 0;
});
let myInstance: OverlayScrollbars | undefined;

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

defineExpose({
    update: async (force?: boolean) => {
        // myInstance?.update(force ?? false);
        myInstance?.destroy();
        await nextTick();
        OverlayScrollbars(
            overlayscrollbarsReference.value!,
            {
                scrollbars: {
                    autoHide: autoHide,
                    autoHideDelay: 1300,
                    autoHideSuspend: autoHideSuspend,
                    dragScroll: true,
                    theme: isDarkMode.value ? 'os-theme-light' : 'os-theme-dark',
                    visibility: 'auto'
                }
            },
            {
                initialized(instance) {
                    console.log('ScrollArea initialised');
                    handleInitialised(instance);
                },
                updated() {
                    console.log('ScrollArea Updated');
                }
            }
        );
    }
});

function handleInitialised(instance: OverlayScrollbars): void {
    const { viewport, scrollbarVertical } = instance.elements();
    myInstance = instance;
    scrollElement = viewport;
    // osHandleElement = scrollbarVertical.handle;
    // osHandleElement.addEventListener('pointerdown', onHandlePointerDown);
    // document.addEventListener('pointerup', onDocumentPointerUp);
    // viewport.addEventListener('scroll', onViewportScroll, { passive: true });

    emit('initialised', scrollElement);
}

// function onHandlePointerDown(): void {
//     isDragging.value = true;
// }

// function onDocumentPointerUp(): void {
//     isDragging.value = false;
// }

// function onViewportScroll(): void {
//     const element = scrollElement;
//     if (!element) return;
//     if (knowledgePaneIsVisible.value) contentScrollPosition.value = element.scrollTop;
//     const maxScroll = element.scrollHeight - element.clientHeight;
//     if (maxScroll <= 0) return;
//     const ratio = element.scrollTop / maxScroll;
//     currentRow.value = Math.max(1, Math.round(ratio * rowCount));
//     labelOffsetY.value = ratio * (element.clientHeight - 40) + 20;
// }
</script>

<!-- <template>
    <div class="relative min-h-0 min-w-0 bg-red-100">
        <OverlayScrollbarsComponent
            :class="['h-full', scrollAreaInset]"
            defer
            :options="{
                scrollbars: {
                    autoHide: autoHide,
                    autoHideDelay: 1300,
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

        <div id="overlayscrollbars" class="" :class="[scrollAreaInset]" data-overlayscrollbars-initialize>
        <slot />
    </div>

        <div
            v-if="isDragging && rowCount > 0"
            class="pointer-events-none absolute right-14 z-20 rounded-full bg-zinc-800 px-3 py-1.5 text-sm font-semibold text-zinc-50 select-none dark:bg-zinc-200 dark:text-zinc-800"
            :style="{ top: labelOffsetY + 'px', transform: 'translateY(-50%)' }"
        >
            {{ currentRow.toLocaleString() }}
        </div>
    </div>
</template> -->

<template>
    <div ref="overlayscrollbarsReference" :class="[scrollAreaInset]" data-overlayscrollbars-initialize>
        <slot />
    </div>
</template>

<style scoped>
/* Disable overscroll. */
:deep([data-overlayscrollbars-viewport]) {
    overscroll-behavior: none;
}

/* Padding for instances nested inside another component (does not extend to the bottom of the screen). */
.embedded {
    padding-right: 16px;
    padding-bottom: var(--vertical-scroll-bottom-embedded-inset);
}

/* Padding for instances that extend to the bottom of the screen. */
.screen {
    padding-right: 16px !important;
    padding-bottom: var(--vertical-scroll-bottom-screen-inset) !important;
}
</style>
