<script setup lang="ts">
// ── External Dependencies & Registrations
import { CheckIcon } from '@lucide/vue';
import { type Component, computed, nextTick, ref, useId, useTemplateRef } from 'vue';
import { onClickOutside, useEventListener } from '@vueuse/core';

// ── Local Framework
import { TEXT } from './ColumnMenu_.json';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import type { SelectOption } from '@/components/ui/SelectInput.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface MenuChoice {
    id: string;
    isChecked: boolean;
    label: string;
}

interface MenuChoiceGroup {
    choices: MenuChoice[];
    id: string;
    label: string | undefined; // Undefined for choices listed under the menu group's own label.
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const VIEWPORT_MARGIN_PX = 8; // Keeps the open menu clear of the window's edges.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const {
    columnLabel,
    decimalSeparatorOptions = [],
    decimalSeparatorValue,
    isDisabled,
    isTypeChosen,
    nullWordReading,
    nullWordValueCount = 0,
    typeIcon,
    typeOptions,
    typeText,
    typeValue
} = defineProps<{
    columnLabel: string;
    decimalSeparatorOptions?: SelectOption[]; // Only a column of numbers has any.
    decimalSeparatorValue?: string;
    isDisabled?: boolean; // The choices are locked while an audit runs, and a derived column has none. Show detail stays available.
    isTypeChosen: boolean; // Marks the icon with a dot, as a compact select marks a value the user chose.
    nullWordReading?: 'empty' | 'text'; // Only a text column has the choice. Not a boolean, because Vue reads a missing boolean as false.
    nullWordValueCount?: number;
    typeIcon: Component | undefined;
    typeOptions: SelectOption[];
    typeText: string; // The type the column is read as, for the button's accessible name, because the icon alone does not say it.
    typeValue: string;
}>();

const emit = defineEmits<{
    showDetail: [];
    'update:decimalSeparatorValue': [decimalSeparatorValue: string];
    'update:nullWordsAreEmpty': [nullWordsAreEmpty: boolean];
    'update:typeValue': [typeValue: string];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menuId = useId();
const buttonElement = useTemplateRef<InstanceType<typeof ActionWrapper>>('button');
const menuElement = useTemplateRef<HTMLDivElement>('menu');
const menuIsOpen = ref(false);
const menuPosition = ref({ left: 0, maxHeight: 0, top: 0 });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const buttonLabel = computed(() => t(TEXT, isTypeChosen ? 'menu.chosen.aria' : 'menu.aria', { label: columnLabel, type: typeText }));

// ── Type ─ Choices next to each other with the same group label, such as the kinds of number, form one group.
const typeGroups = computed((): MenuChoiceGroup[] => {
    const groups: MenuChoiceGroup[] = [];
    for (const option of typeOptions) {
        const choice = { id: option.id, isChecked: option.id === typeValue, label: option.label };
        const lastGroup = groups.at(-1);
        if (lastGroup != null && lastGroup.label === option.groupLabel) lastGroup.choices.push(choice);
        else groups.push({ choices: [choice], id: option.id, label: option.groupLabel });
    }
    return groups;
});

const decimalSeparatorChoices = computed((): MenuChoice[] =>
    decimalSeparatorOptions.map((option) => ({ id: option.id, isChecked: option.id === decimalSeparatorValue, label: option.label }))
);

const nullWordsLabel = computed(() => t(TEXT, 'nullWords.label', { count: new Intl.NumberFormat(localeId.value).format(nullWordValueCount) }));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onClickOutside(
    menuElement,
    () => {
        menuIsOpen.value = false;
    },
    { ignore: [buttonElement] } // The button toggles the menu, so a click there must not close it first.
);

// The open menu is placed once and does not follow the page, so it closes rather than drift from its column. A scroll
// inside the menu itself leaves it open.
useEventListener(
    globalThis,
    'scroll',
    (event: Event) => {
        if (event.target instanceof Node && menuElement.value?.contains(event.target) === true) return;
        menuIsOpen.value = false;
    },
    { capture: true, passive: true }
);
useEventListener(globalThis, 'resize', () => {
    menuIsOpen.value = false;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleToggleMenu(): Promise<void> {
    if (menuIsOpen.value) {
        menuIsOpen.value = false;
        return;
    }
    await openMenu();
}

// The arrow keys open the menu from its button, as the WAI-ARIA menu button pattern expects.
async function handleOpenMenuByKey(event: KeyboardEvent): Promise<void> {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    await openMenu();
}

// Arrow keys, Home and End move through every item. Escape closes the menu and returns to its button. Tab closes it and
// moves on, so focus never stays in a menu that is out of the tab order.
function handleNavigateMenu(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
    }
    if (event.key === 'Tab') {
        menuIsOpen.value = false;
        return;
    }
    const menuItems = listMenuItems();
    const itemIndex = menuItems.indexOf(event.target as HTMLElement);
    const lastIndex = menuItems.length - 1;
    const nextIndexByKey: Partial<Record<string, number>> = {
        ArrowDown: itemIndex === lastIndex ? 0 : itemIndex + 1,
        ArrowUp: itemIndex <= 0 ? lastIndex : itemIndex - 1,
        End: lastIndex,
        Home: 0
    };
    const nextIndex = nextIndexByKey[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    menuItems[nextIndex]?.focus();
}

function handleSelectType(typeValue: string): void {
    closeMenu();
    emit('update:typeValue', typeValue);
}

function handleSelectDecimalSeparator(decimalSeparatorValue: string): void {
    closeMenu();
    emit('update:decimalSeparatorValue', decimalSeparatorValue);
}

function handleToggleNullWords(): void {
    closeMenu();
    emit('update:nullWordsAreEmpty', nullWordReading !== 'empty');
}

function handleShowDetail(): void {
    closeMenu();
    emit('showDetail');
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The menu opens below its button, on the page rather than in the header, because the table's header clips anything
// below its own row. Once it is drawn it moves left to stay inside the window, and scrolls when the window is short.
async function openMenu(): Promise<void> {
    const buttonBounds = (buttonElement.value?.$el as HTMLElement | undefined)?.getBoundingClientRect();
    if (buttonBounds == null) return;
    menuPosition.value = { left: buttonBounds.left, maxHeight: innerHeight - buttonBounds.bottom - VIEWPORT_MARGIN_PX, top: buttonBounds.bottom };
    menuIsOpen.value = true;
    await nextTick();
    const menuWidth = menuElement.value?.offsetWidth ?? 0;
    const rightOverflow = buttonBounds.left + menuWidth - (document.documentElement.clientWidth - VIEWPORT_MARGIN_PX);
    if (rightOverflow > 0) menuPosition.value = { ...menuPosition.value, left: Math.max(VIEWPORT_MARGIN_PX, buttonBounds.left - rightOverflow) };
    const menuItems = listMenuItems();
    (menuItems.find((menuItem) => menuItem.getAttribute('aria-checked') === 'true') ?? menuItems.at(0))?.focus();
}

function closeMenu(): void {
    menuIsOpen.value = false;
    (buttonElement.value?.$el as HTMLElement | undefined)?.focus();
}

function listMenuItems(): HTMLElement[] {
    return [...(menuElement.value?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? [])];
}
</script>

<template>
    <!-- Type Icon ─ The button for the column's menu, as a column's type icon is in a spreadsheet's query editor. Its name
         says the type, because the icon alone does not. -->
    <ActionWrapper
        ref="button"
        :aria-controls="menuIsOpen ? menuId : undefined"
        :aria-expanded="menuIsOpen"
        aria-haspopup="menu"
        :aria-label="buttonLabel"
        class="relative -ml-1 flex flex-none items-center rounded-md p-1 text-sm text-muted hover:state-hover active:state-press"
        data-region="ColumnMenu"
        :title="buttonLabel"
        @click="handleToggleMenu"
        @keydown="handleOpenMenuByKey"
    >
        <component :is="typeIcon" aria-hidden="true" class="size-[1.25em] flex-none" />
        <span v-if="isTypeChosen" aria-hidden="true" class="absolute top-0.5 right-0.5 size-2 rounded-full bg-muted" />
    </ActionWrapper>

    <Teleport to="body">
        <div
            v-if="menuIsOpen"
            :id="menuId"
            ref="menu"
            :aria-label="buttonLabel"
            class="fixed z-50 min-w-48 overflow-y-auto rounded-md border border-separator bg-surface p-1 text-sm text-content shadow-md"
            role="menu"
            tabindex="-1"
            :style="{ left: `${menuPosition.left}px`, maxHeight: `${menuPosition.maxHeight}px`, top: `${menuPosition.top}px` }"
            @keydown="handleNavigateMenu"
        >
            <!-- Type -->
            <div :aria-label="t(TEXT, 'type.label')" role="group">
                <div aria-hidden="true" class="px-2 pt-1 pb-0.5 text-xs font-medium text-muted">{{ t(TEXT, 'type.label') }}</div>
                <div v-for="group in typeGroups" :key="group.id" :aria-label="group.label" :role="group.label == null ? undefined : 'group'">
                    <div v-if="group.label != null" aria-hidden="true" class="px-2 pt-1 text-xs text-subtle">{{ group.label }}</div>
                    <button
                        v-for="choice in group.choices"
                        :key="choice.id"
                        :aria-checked="choice.isChecked"
                        :aria-disabled="isDisabled || undefined"
                        class="flex w-full items-center gap-x-1.5 rounded px-2 py-1 text-left not-aria-disabled:hover:state-hover aria-disabled:text-subtle"
                        role="menuitemradio"
                        tabindex="-1"
                        type="button"
                        @click="isDisabled ? undefined : handleSelectType(choice.id)"
                    >
                        <CheckIcon aria-hidden="true" class="size-3.5 flex-none" :class="{ invisible: !choice.isChecked }" :stroke-width="1.5" />
                        {{ choice.label }}
                    </button>
                </div>
            </div>

            <!-- Decimal Separator ─ Only for a column of numbers. -->
            <div v-if="decimalSeparatorChoices.length > 0" :aria-label="t(TEXT, 'decimalSeparator.label')" class="mt-1 border-t border-separator pt-1" role="group">
                <div aria-hidden="true" class="px-2 pt-1 pb-0.5 text-xs font-medium text-muted">{{ t(TEXT, 'decimalSeparator.label') }}</div>
                <button
                    v-for="choice in decimalSeparatorChoices"
                    :key="choice.id"
                    :aria-checked="choice.isChecked"
                    :aria-disabled="isDisabled || undefined"
                    class="flex w-full items-center gap-x-1.5 rounded px-2 py-1 text-left not-aria-disabled:hover:state-hover aria-disabled:text-subtle"
                    role="menuitemradio"
                    tabindex="-1"
                    type="button"
                    @click="isDisabled ? undefined : handleSelectDecimalSeparator(choice.id)"
                >
                    <CheckIcon aria-hidden="true" class="size-3.5 flex-none" :class="{ invisible: !choice.isChecked }" :stroke-width="1.5" />
                    {{ choice.label }}
                </button>
            </div>

            <!-- Null Words ─ Only for a text column. Off by default, because in a text column 'NA' can be data, such as
                 Namibia's country code. -->
            <div v-if="nullWordReading != null" class="mt-1 border-t border-separator pt-1">
                <button
                    :aria-checked="nullWordReading === 'empty'"
                    :aria-disabled="isDisabled || undefined"
                    class="flex w-full items-center gap-x-1.5 rounded px-2 py-1 text-left not-aria-disabled:hover:state-hover aria-disabled:text-subtle"
                    role="menuitemcheckbox"
                    tabindex="-1"
                    type="button"
                    @click="isDisabled ? undefined : handleToggleNullWords()"
                >
                    <CheckIcon aria-hidden="true" class="size-3.5 flex-none" :class="{ invisible: nullWordReading !== 'empty' }" :stroke-width="1.5" />
                    {{ nullWordsLabel }}
                </button>
            </div>

            <!-- Show Detail -->
            <div class="mt-1 border-t border-separator pt-1">
                <button
                    class="flex w-full items-center gap-x-1.5 rounded px-2 py-1 text-left hover:state-hover"
                    role="menuitem"
                    tabindex="-1"
                    type="button"
                    @click="handleShowDetail"
                >
                    <span aria-hidden="true" class="size-3.5 flex-none" />
                    {{ t(TEXT, 'detail.label') }}
                </button>
            </div>
        </div>
    </Teleport>
</template>
