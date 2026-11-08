<script setup lang="ts">
// ── External Dependencies & Registrations
import { useFocusWithin } from '@vueuse/core';
import { nextTick, ref, useId, useTemplateRef, watch } from 'vue';
import { SearchIcon, TriangleAlertIcon } from '@lucide/vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './ColumnSearch_.json';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ComboboxInput from '@/components/ui/ComboboxInput.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ColumnSearchOption {
    id: string; // The column's position in the item, as text.
    label: string;
    needsAttention: boolean; // Has values that need checking, so the list marks it as the table does.
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { options } = defineProps<{ options: ColumnSearchOption[] }>();

const emit = defineEmits<{ select: [columnIndex: number] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const buttonId = useId(); // Focus goes back to the icon when the field closes.
const fieldElement = useTemplateRef<HTMLDivElement>('field');
const fieldIsOpen = ref(false);
const { focused: fieldHasFocus } = useFocusWithin(fieldElement);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Clicking or tabbing away closes the search, leaving focus where the user put it.
watch(fieldHasFocus, (hasFocus) => {
    if (!hasFocus) fieldIsOpen.value = false;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleOpen(): Promise<void> {
    fieldIsOpen.value = true;
    await nextTick();
    fieldElement.value?.querySelector('input')?.focus();
}

// A chosen column is handed over before the field closes, so focus is back on the icon once the host has acted on it.
function handleSelect(option: ColumnSearchOption): void {
    emit('select', Number(option.id));
    handleClose();
}

// Escape, once the field has nothing left to undo, hands focus back to the icon that opened it.
function handleClose(): void {
    fieldIsOpen.value = false;
    document.querySelector<HTMLElement>(`#${buttonId}`)?.focus();
}
</script>

<template>
    <!-- 'contents', so the icon is one of the toolbar's own items, and the open field covers the toolbar, which must be
         positioned. The icon stays in the row under the field, so the toolbar's fit does not change as it opens. -->
    <div class="contents" data-region="ColumnSearch">
        <ActionWrapper
            :id="buttonId"
            :aria-expanded="fieldIsOpen"
            :aria-label="t(TEXT, 'search.aria')"
            class="flex h-7 flex-none items-center rounded-md px-1 hover:state-hover active:state-press"
            :title="t(TEXT, 'search.aria')"
            @click="handleOpen"
        >
            <SearchIcon aria-hidden="true" class="size-5" :stroke-width="1.5" />
        </ActionWrapper>
        <div v-if="fieldIsOpen" ref="field" class="absolute inset-0 z-20 flex items-center bg-surface px-page">
            <ComboboxInput
                class="min-w-0 flex-1"
                :empty-text="t(TEXT, 'search.empty.text')"
                :label="t(TEXT, 'search.aria')"
                :options="options"
                :placeholder="t(TEXT, 'search.placeholder')"
                @keydown.escape="handleClose"
                @select="handleSelect"
            >
                <template #option-icon="{ option }">
                    <TriangleAlertIcon
                        v-if="option.needsAttention"
                        :aria-label="t(TEXT, 'attention.aria')"
                        class="size-4 flex-none text-warning-text"
                        role="img"
                        :stroke-width="1.5"
                    />
                </template>
            </ComboboxInput>
        </div>
    </div>
</template>
