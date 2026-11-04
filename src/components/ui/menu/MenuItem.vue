<script setup lang="ts">
// ── External Dependencies & Registrations
import { CheckIcon } from '@lucide/vue';
import { inject } from 'vue';

// ── Local Framework
import { assertDefined } from '@/utilities';
import { menuContextKey } from './menu';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ROLES = { action: 'menuitem', checkbox: 'menuitemcheckbox', radio: 'menuitemradio' } as const;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const {
    isChecked,
    isDisabled,
    kind = 'action'
} = defineProps<{
    isChecked?: boolean;
    isDisabled?: boolean; // Still shown, but skipped by the arrow keys and not chosen on click.
    kind?: 'action' | 'checkbox' | 'radio'; // 'radio' is one choice from a set, 'checkbox' an on/off setting. Both show a tick when checked.
}>();

defineSlots<{
    default(): unknown;
    icon?(): unknown; // Rendered after the tick and before the label.
}>();

const emit = defineEmits<{ select: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menu = assertDefined(inject(menuContextKey), "Expected 'MenuItem' inside 'MenuRoot'.");

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// The menu closes before the choice is handed over, so focus is back on the trigger when the choice takes effect.
function handleSelect(): void {
    if (isDisabled) return;
    menu.closeMenu(true);
    emit('select');
}
</script>

<template>
    <button
        :aria-checked="kind === 'action' ? undefined : isChecked"
        :aria-disabled="isDisabled || undefined"
        class="menu-item"
        data-region="MenuItem"
        :role="ROLES[kind]"
        tabindex="-1"
        type="button"
        @click="handleSelect"
    >
        <!-- Tick ─ Kept in place while unchecked, so the labels of a set line up. -->
        <CheckIcon v-if="kind !== 'action'" aria-hidden="true" class="size-3.5 flex-none" :class="{ invisible: !isChecked }" :stroke-width="1.5" />
        <slot name="icon" />
        <span class="min-w-0 flex-1">
            <slot />
        </span>
    </button>
</template>
