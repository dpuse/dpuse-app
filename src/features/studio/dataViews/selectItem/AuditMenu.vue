<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronDownIcon } from '@lucide/vue';
import { onClickOutside } from '@vueuse/core';
import { nextTick, ref, useId, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './AuditMenu_.json';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ItemButton from '@/components/ui/action/ItemButton.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface AuditChoice {
    byteLimit: number | undefined; // Undefined audits the whole item.
    id: string;
    label: string;
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { auditChoices, disabled } = defineProps<{
    auditChoices: AuditChoice[];
    disabled: boolean;
}>();

const emit = defineEmits<{
    select: [byteLimit: number | undefined];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menuId = useId();
const menuElement = useTemplateRef<HTMLDivElement>('menu');
const menuIsOpen = ref(false);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onClickOutside(menuElement, () => {
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

// Arrow keys, Home and End move through the menu. Escape closes it and returns to its button. Tab closes it and moves on,
// so focus never stays in a menu that is out of the tab order.
function handleNavigateMenu(event: KeyboardEvent, choiceIndex: number): void {
    if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
        return;
    }
    if (event.key === 'Tab') {
        menuIsOpen.value = false;
        return;
    }
    const lastIndex = auditChoices.length - 1;
    const nextIndexByKey: Partial<Record<string, number>> = {
        ArrowDown: choiceIndex === lastIndex ? 0 : choiceIndex + 1,
        ArrowUp: choiceIndex === 0 ? lastIndex : choiceIndex - 1,
        End: lastIndex,
        Home: 0
    };
    const nextIndex = nextIndexByKey[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    focusChoice(nextIndex);
}

function handleSelectChoice(byteLimit: number | undefined): void {
    closeMenu();
    emit('select', byteLimit);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function openMenu(): Promise<void> {
    menuIsOpen.value = true;
    await nextTick();
    focusChoice(0);
}

function closeMenu(): void {
    menuIsOpen.value = false;
    menuElement.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus();
}

function focusChoice(choiceIndex: number): void {
    menuElement.value?.querySelectorAll<HTMLElement>('[role="menuitem"]')[choiceIndex]?.focus();
}
</script>

<template>
    <div ref="menu" class="relative flex-none">
        <ActionWrapper
            :aria-controls="menuIsOpen ? menuId : undefined"
            :aria-expanded="menuIsOpen"
            aria-haspopup="menu"
            class="flex items-center gap-x-0.5 text-accent hover:underline disabled:text-muted"
            :disabled="disabled"
            @click="handleToggleMenu"
            @keydown="handleOpenMenuByKey"
        >
            {{ t(TEXT, 'audit.label') }}
            <ChevronDownIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
        </ActionWrapper>

        <div
            v-if="menuIsOpen"
            :id="menuId"
            :aria-label="t(TEXT, 'audit.aria')"
            class="absolute top-full right-0 z-30 mt-1 min-w-32 rounded-md border border-separator bg-surface p-1 text-sm text-content shadow-md"
            role="menu"
        >
            <ItemButton
                v-for="(auditChoice, choiceIndex) in auditChoices"
                :key="auditChoice.id"
                class="mt-0.5 first:mt-0"
                role="menuitem"
                tabindex="-1"
                @click="handleSelectChoice(auditChoice.byteLimit)"
                @keydown="handleNavigateMenu($event, choiceIndex)"
            >
                {{ auditChoice.label }}
            </ItemButton>
        </div>
    </div>
</template>
