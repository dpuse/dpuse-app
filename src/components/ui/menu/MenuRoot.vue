<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, provide, ref, shallowRef, useId, useTemplateRef } from 'vue';
import { onClickOutside, useEventListener } from '@vueuse/core';

// ── Local Framework
import { menuContextKey, type MenuTriggerAttributes } from './menu';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineSlots<{
    default(): unknown; // The menu's 'MenuContent', rendered only while the menu is open.
    trigger(properties: { triggerAttributes: MenuTriggerAttributes }): unknown; // The button that opens the menu, with 'triggerAttributes' bound to it.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menuId = useId();
const rootElement = useTemplateRef<HTMLDivElement>('root');
const contentElement = shallowRef<HTMLElement>();
const triggerElement = shallowRef<HTMLElement>();
const menuIsOpen = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const triggerAttributes = computed((): MenuTriggerAttributes => ({
    'aria-controls': menuIsOpen.value ? menuId : undefined,
    'aria-expanded': menuIsOpen.value,
    'aria-haspopup': 'menu',
    onClick: handleToggleMenu,
    onKeydown: handleOpenMenuByKey
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

provide(menuContextKey, { closeMenu, contentElement, menuId, triggerElement });

onMounted(() => {
    triggerElement.value = rootElement.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]') ?? undefined;
});

onClickOutside(
    contentElement,
    () => {
        closeMenu(false);
    },
    { ignore: [triggerElement] } // The trigger toggles the menu, so a click there must not close it first.
);

// The open menu is placed once and does not follow the page, so it closes rather than drift from its trigger. A scroll
// inside the menu itself leaves it open.
useEventListener(
    globalThis,
    'scroll',
    (event: Event) => {
        if (!menuIsOpen.value || (event.target instanceof Node && contentElement.value?.contains(event.target) === true)) return;
        closeMenu(false);
    },
    { capture: true, passive: true }
);
useEventListener(globalThis, 'resize', () => {
    closeMenu(false);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleToggleMenu(): void {
    menuIsOpen.value = !menuIsOpen.value;
}

// The arrow keys open the menu from its trigger, as the WAI-ARIA menu button pattern expects.
function handleOpenMenuByKey(event: KeyboardEvent): void {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    menuIsOpen.value = true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function closeMenu(isFocusReturned: boolean): void {
    menuIsOpen.value = false;
    if (isFocusReturned) triggerElement.value?.focus();
}
</script>

<template>
    <div ref="root" data-region="Menu">
        <slot name="trigger" :trigger-attributes="triggerAttributes" />
        <slot v-if="menuIsOpen" />
    </div>
</template>
