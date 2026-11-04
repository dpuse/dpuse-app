<script setup lang="ts">
// ── External Dependencies & Registrations
import { type CSSProperties, inject, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

// ── Local Framework
import { assertDefined } from '@/utilities';
import { menuContextKey } from './menu';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TRIGGER_GAP_PX = 4;
const VIEWPORT_MARGIN_PX = 8; // Keeps the open menu clear of the window's edges.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { label, placement = 'bottom-start' } = defineProps<{
    label: string; // The menu's name for screen readers.
    placement?: 'bottom-end' | 'bottom-start' | 'top-start'; // Which side of the trigger the menu opens on, and which edge it lines up with. 'top-start' is for a trigger at the bottom of a pane.
}>();

defineSlots<{
    default(): unknown; // 'MenuItem', 'MenuGroup' and 'MenuSeparator'.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menu = assertDefined(inject(menuContextKey), "Expected 'MenuContent' inside 'MenuRoot'.");
const contentElement = useTemplateRef<HTMLDivElement>('content');
const contentPosition = ref<CSSProperties>({});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// The menu opens in the top layer, so no pane, table header or dialog around its trigger can clip or cover it. Focus
// starts on the chosen item, so the arrow keys move on from what is already chosen.
onMounted(() => {
    menu.contentElement.value = contentElement.value ?? undefined;
    contentElement.value?.showPopover();
    placeContent();
    const menuItems = listMenuItems();
    (menuItems.find((menuItem) => menuItem.getAttribute('aria-checked') === 'true') ?? menuItems.at(0))?.focus();
});

onBeforeUnmount(() => {
    menu.contentElement.value = undefined;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Arrow keys, Home and End move through the items, skipping a disabled one. Escape closes the menu and returns to its
// trigger. Tab closes it and moves on, so focus never stays in a menu that is out of the tab order.
function handleNavigateMenu(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        event.preventDefault();
        menu.closeMenu(true);
        return;
    }
    if (event.key === 'Tab') {
        menu.closeMenu(false);
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

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Lines the menu up with its trigger, moved in to stay inside the window, and lets it scroll when the window is short.
// '--menu-max-height' caps a menu whose list has no natural length.
function placeContent(): void {
    const triggerBounds = menu.triggerElement.value?.getBoundingClientRect();
    if (triggerBounds == null) return;
    const contentWidth = contentElement.value?.offsetWidth ?? 0;
    const preferredLeft = placement === 'bottom-end' ? triggerBounds.right - contentWidth : triggerBounds.left;
    const left = `${String(Math.max(VIEWPORT_MARGIN_PX, Math.min(preferredLeft, document.documentElement.clientWidth - VIEWPORT_MARGIN_PX - contentWidth)))}px`;
    if (placement === 'top-start') {
        const availableHeight = triggerBounds.top - TRIGGER_GAP_PX - VIEWPORT_MARGIN_PX;
        contentPosition.value = { bottom: `${String(innerHeight - triggerBounds.top + TRIGGER_GAP_PX)}px`, left, maxHeight: constructMaxHeight(availableHeight) };
        return;
    }
    const top = triggerBounds.bottom + TRIGGER_GAP_PX;
    contentPosition.value = { left, maxHeight: constructMaxHeight(innerHeight - top - VIEWPORT_MARGIN_PX), top: `${String(top)}px` };
}

function constructMaxHeight(availableHeight: number): string {
    return `min(var(--menu-max-height, 100dvh), ${String(availableHeight)}px)`;
}

function listMenuItems(): HTMLElement[] {
    return [...(contentElement.value?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not([aria-disabled="true"])') ?? [])];
}
</script>

<template>
    <!-- Menu ─ 'inset-auto m-0' undoes the browser's centring of a popover, so the position set from the trigger holds. -->
    <div
        :id="menu.menuId"
        ref="content"
        :aria-label="label"
        class="inset-auto m-0 overflow-y-auto menu-panel"
        data-region="MenuContent"
        popover="manual"
        role="menu"
        :style="contentPosition"
        tabindex="-1"
        @keydown="handleNavigateMenu"
    >
        <slot />
    </div>
</template>
