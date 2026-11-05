<script setup lang="ts" generic="TOption extends { id: string; label: string }">
// ── External Dependencies & Registrations
import { SearchIcon } from '@lucide/vue';
import { computed, nextTick, ref, useId, useTemplateRef } from 'vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const {
    emptyText,
    label,
    options = [],
    placeholder
} = defineProps<{
    emptyText: string; // Shown in the open list when nothing matches.
    label: string; // Names the field for screen readers, because the placeholder goes once the user types.
    options?: TOption[];
    placeholder?: string;
}>();

defineSlots<{
    'option-icon'?(properties: { option: TOption }): unknown; // Rendered after each option's label, e.g. a warning.
}>();

const emit = defineEmits<{ select: [option: TOption] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const listboxId = useId();
const listboxElement = useTemplateRef<HTMLUListElement>('listbox');
const searchText = ref('');
const listIsOpen = ref(false);
const currentOptionIndex = ref<number>(); // The option the arrow keys are on, which Enter chooses.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Matches anywhere in the label, ignoring case and accents, so 'resume' finds 'Résumé'.
const matchingOptions = computed(() => {
    const searchKey = constructSearchKey(searchText.value.trim());
    return searchKey === '' ? options : options.filter((option) => constructSearchKey(option.label).includes(searchKey));
});
const currentOptionElementId = computed(() => {
    const currentOption = currentOptionIndex.value == null ? undefined : matchingOptions.value[currentOptionIndex.value];
    return currentOption && listIsOpen.value ? createOptionElementId(currentOption) : undefined;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Typing opens the list on the first match, so Enter chooses it straight away.
function handleSearch(): void {
    listIsOpen.value = true;
    if (matchingOptions.value.length > 0) moveToOption(0);
    else currentOptionIndex.value = undefined;
}

function handleOpenList(): void {
    listIsOpen.value = true;
}

// The keys of the WAI-ARIA combobox pattern. Focus stays in the field, and the arrow keys move through the list.
function handleNavigateOptions(event: KeyboardEvent): void {
    switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp':
            event.preventDefault();
            stepThroughOptions(event.key === 'ArrowDown', event.altKey);
            break;
        case 'Enter':
            chooseCurrentOption(event);
            break;
        case 'Escape':
            undoSearch(event);
            break;
        default:
    }
}

function handleSelectOption(option: TOption): void {
    emit('select', option);
    searchText.value = '';
    handleCloseList();
}

function handleCloseList(): void {
    listIsOpen.value = false;
    currentOptionIndex.value = undefined;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructSearchKey(text: string): string {
    return text
        .normalize('NFD')
        .replaceAll(/\p{Mn}/gu, '')
        .toLocaleLowerCase();
}

function createOptionElementId(option: TOption): string {
    return `${listboxId}-${option.id}`;
}

// Enter chooses the option the arrow keys are on. With none, it is left to whatever holds the field.
function chooseCurrentOption(event: KeyboardEvent): void {
    const currentOption = listIsOpen.value && currentOptionIndex.value != null ? matchingOptions.value[currentOptionIndex.value] : undefined;
    if (currentOption == null) return;
    event.preventDefault();
    handleSelectOption(currentOption);
}

// Alt with an arrow only opens or closes the list. Otherwise the arrows move one option, wrapping at either end, and
// start from the first or last when none is current.
function stepThroughOptions(isDown: boolean, isAltPressed: boolean): void {
    if (isAltPressed) {
        listIsOpen.value = isDown;
        return;
    }
    listIsOpen.value = true;
    const optionCount = matchingOptions.value.length;
    if (optionCount === 0) return;
    const currentIndex = currentOptionIndex.value;
    if (currentIndex == null) {
        moveToOption(isDown ? 0 : optionCount - 1);
        return;
    }
    moveToOption((currentIndex + (isDown ? 1 : -1) + optionCount) % optionCount);
}

// Escape closes the list, then clears the search. With neither to undo, it goes on to whatever holds the field.
function undoSearch(event: KeyboardEvent): void {
    if (!listIsOpen.value && searchText.value === '') return;
    event.preventDefault();
    event.stopPropagation();
    if (listIsOpen.value) handleCloseList();
    else searchText.value = '';
}

// Keeps the option the arrow keys are on in view in a long list.
function moveToOption(optionIndex: number): void {
    currentOptionIndex.value = optionIndex;
    void nextTick(() => {
        listboxElement.value?.children[optionIndex]?.scrollIntoView({ block: 'nearest' });
    });
}
</script>

<template>
    <div class="relative" data-region="ComboboxInput">
        <SearchIcon aria-hidden="true" class="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted" :stroke-width="1.5" />
        <input
            v-model="searchText"
            :aria-activedescendant="currentOptionElementId"
            aria-autocomplete="list"
            :aria-controls="listboxId"
            :aria-expanded="listIsOpen"
            :aria-label="label"
            autocomplete="off"
            class="h-8 w-full min-w-0 rounded-md border border-boundary bg-surface pr-2 pl-7.5 text-sm text-content placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus-ring"
            :placeholder="placeholder"
            role="combobox"
            spellcheck="false"
            type="text"
            @blur="handleCloseList"
            @click="handleOpenList"
            @input="handleSearch"
            @keydown="handleNavigateOptions"
        />

        <!-- List ─ Kept in the page while closed, because the field's 'aria-controls' names it. A press on an option is
             kept from taking focus, so the field does not blur and close the list before the click arrives. The options
             are never focused: the field keeps focus and names the current one with 'aria-activedescendant', and its
             keys choose, so an option needs no focus or keys of its own. -->
        <div v-show="listIsOpen" class="absolute top-full right-0 z-20 mt-1 max-h-64 w-max max-w-72 min-w-full overflow-y-auto menu-panel">
            <ul :id="listboxId" ref="listbox" :aria-label="label" role="listbox">
                <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/interactive-supports-focus -->
                <li
                    v-for="(option, optionIndex) in matchingOptions"
                    :id="createOptionElementId(option)"
                    :key="option.id"
                    :aria-selected="optionIndex === currentOptionIndex"
                    class="menu-item"
                    :class="{ 'state-hover': optionIndex === currentOptionIndex }"
                    role="option"
                    @click="handleSelectOption(option)"
                    @mousedown.prevent
                >
                    <span class="min-w-0 flex-1 truncate">{{ option.label }}</span>
                    <slot name="option-icon" :option="option" />
                </li>
            </ul>
            <p v-if="matchingOptions.length === 0" class="m-0 px-2 py-1 text-sm text-muted">{{ emptyText }}</p>
        </div>
    </div>
</template>
