// ── External Dependencies & Registrations
import { dragAndDrop } from '@formkit/drag-and-drop/vue';
import { tearDown } from '@formkit/drag-and-drop';
import { type ComponentPublicInstance, computed, type ComputedRef, nextTick, onBeforeUnmount, ref, watch, type WritableComputedRef } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface UseSelectColumnSortOptions {
    isOpen: ComputedRef<boolean>;
    values: WritableComputedRef<string[]>;
}

interface UseSelectColumnSortResult {
    bindGridElement: (instance: Element | ComponentPublicInstance | null) => void;
    sortEnabled: ComputedRef<boolean>;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const SELECT_DRAG_HANDLE_SELECTOR = '[data-select-handle]';
const SELECT_DRAG_PLACEHOLDER_CLASS = 'select-drag-placeholder';
const SELECTED_TILE_ATTRIBUTE = 'data-selected';
const SELECTED_TILE_VALUE = 'true';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useSelectColumnSort({ isOpen, values }: UseSelectColumnSortOptions): UseSelectColumnSortResult {
    const selectGridElement = ref<HTMLElement>();
    const sortEnabled = computed(() => !isOpen.value && values.value.length > 1);
    let activeSelectGridElement: HTMLElement | undefined;

    function bindGridElement(instance: Element | ComponentPublicInstance | null): void {
        if (!instance || isOpen.value) {
            selectGridElement.value = undefined;
            return;
        }

        if (instance instanceof HTMLElement) {
            selectGridElement.value = instance;
            return;
        }

        if ('$el' in instance && instance.$el instanceof HTMLElement) {
            selectGridElement.value = instance.$el;
            return;
        }

        selectGridElement.value = undefined;
    }

    function syncDragAndDrop(): void {
        if (activeSelectGridElement && activeSelectGridElement !== selectGridElement.value) {
            tearDown(activeSelectGridElement);
            activeSelectGridElement = undefined;
        }

        if (!sortEnabled.value || !selectGridElement.value) {
            if (activeSelectGridElement) {
                tearDown(activeSelectGridElement);
                activeSelectGridElement = undefined;
            }
            return;
        }

        dragAndDrop<string>({
            parent: selectGridElement,
            values,
            dragHandle: SELECT_DRAG_HANDLE_SELECTOR,
            dragPlaceholderClass: SELECT_DRAG_PLACEHOLDER_CLASS,
            sortable: true,
            synthDragPlaceholderClass: SELECT_DRAG_PLACEHOLDER_CLASS,
            draggable: (child) => child.getAttribute(SELECTED_TILE_ATTRIBUTE) === SELECTED_TILE_VALUE
        });
        activeSelectGridElement = selectGridElement.value;
    }

    async function refreshDragAndDrop(): Promise<void> {
        await nextTick();
        syncDragAndDrop();
    }

    watch([sortEnabled, selectGridElement, (): string[] => [...values.value]], refreshDragAndDrop, { immediate: true });

    onBeforeUnmount(() => {
        if (activeSelectGridElement) tearDown(activeSelectGridElement);
    });

    return {
        bindGridElement,
        sortEnabled
    };
}
