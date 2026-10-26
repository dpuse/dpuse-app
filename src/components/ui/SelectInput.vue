<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronDownIcon } from '@lucide/vue';
import { computed, useId } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface SelectOption {
    groupLabel?: string; // Options next to each other with the same group label are listed under it.
    hasSeparatorAfter?: boolean; // Draws a line after the option in the open list, e.g. to set a default apart. Seen only, not read out.
    id: string;
    isDisabled?: boolean;
    label: string;
}

interface SelectOptionGroup {
    id: string;
    label: string | undefined;
    options: SelectOption[];
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const {
    description,
    disabled,
    isCompact,
    isDefault,
    label,
    labelHidden,
    options = []
} = defineProps<{
    description?: string; // Read out after the value, for what the value alone does not say.
    disabled?: boolean;
    isCompact?: boolean; // Sized and framed for a toolbar: small text, no border until hovered, as wide as its value. Keeps its small text on iOS too.
    isDefault?: boolean; // The value is a default the user has not chosen, so it shows in muted italics. The option's text must say so too.
    label: string;
    labelHidden?: boolean;
    options?: SelectOption[];
}>();

defineSlots<{
    icon?(): unknown; // Rendered before the value, inside its hover fill and focus ring. Compact only.
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const selectId = useId();
const descriptionId = useId();
const selectedOptionId = defineModel<string>({ default: '' });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Options next to each other with the same group label form one group. An option without one stands alone.
const optionGroups = computed(() => {
    const groups: SelectOptionGroup[] = [];
    for (const option of options) {
        const lastGroup = groups.at(-1);
        if (option.groupLabel != null && lastGroup?.label === option.groupLabel) lastGroup.options.push(option);
        else groups.push({ id: `${String(groups.length)}-${option.id}`, label: option.groupLabel, options: [option] });
    }
    return groups;
});

const selectedOptionLabel = computed(() => options.find((option) => option.id === selectedOptionId.value)?.label ?? '');
</script>

<template>
    <div data-region="SelectInput">
        <!-- Label -->
        <label :for="selectId" :class="labelHidden ? 'sr-only' : 'mb-1 block text-xs font-medium text-muted'">{{ label }}</label>

        <!-- Select ─ The browser's own control, for its keyboard, screen reader and touch support. 'appearance-none' drops
             its arrow, which cannot be styled, for a chevron drawn over it.
             Compact ─ iOS Safari zooms into a form field whose text is under 16px, so 'main.css' sets every field to 16px
             there. A compact select shows its value in a span at the toolbar's small size instead, and lies over it
             unseen at full size, so a tap still opens the select and nothing zooms. The span also sizes it to its value.
             It takes the select's hover, focus ring and disabled look through 'peer-*'.
             TODO: Review 'appearance: base-select' later. The open list is drawn by the browser, and on macOS Chrome and
             Safari it ignores CSS, so group labels and options cannot be styled (verified on Chrome 155). 'base-select'
             makes the list and its options styleable through '::picker(select)'. It needs Chrome and Edge 135, and
             Safari 27 is reported. Firefox does not have it. Older browsers show the native list, so it would only
             enhance, not raise the browser floor. -->
        <div class="relative">
            <select
                :id="selectId"
                v-model="selectedOptionId"
                :aria-describedby="description ? descriptionId : undefined"
                class="cursor-pointer appearance-none disabled:cursor-not-allowed"
                :class="
                    isCompact
                        ? 'peer absolute inset-0 size-full opacity-0'
                        : [
                              'h-9 w-full max-w-full min-w-0 truncate rounded-md border border-boundary bg-surface pr-8 pl-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus-ring disabled:opacity-50',
                              isDefault ? 'text-muted italic' : 'text-content'
                          ]
                "
                :disabled="disabled"
            >
                <template v-for="optionGroup in optionGroups" :key="optionGroup.id">
                    <optgroup v-if="optionGroup.label" :label="optionGroup.label">
                        <option v-for="option in optionGroup.options" :key="option.id" :disabled="option.isDisabled" :value="option.id">{{ option.label }}</option>
                    </optgroup>
                    <template v-for="option in optionGroup.options" v-else :key="option.id">
                        <option :disabled="option.isDisabled" :value="option.id">{{ option.label }}</option>
                        <hr v-if="option.hasSeparatorAfter" />
                    </template>
                </template>
            </select>
            <span
                v-if="isCompact"
                aria-hidden="true"
                class="flex h-7 max-w-full items-center gap-x-1 rounded-md border border-transparent pr-6 pl-1.5 text-xs leading-6.5 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-focus-ring peer-hover:peer-enabled:state-hover peer-disabled:opacity-50"
            >
                <slot name="icon" />
                <span class="truncate" :class="isDefault ? 'text-muted italic' : 'text-content'">{{ selectedOptionLabel }}</span>
            </span>
            <ChevronDownIcon
                aria-hidden="true"
                class="pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted"
                :class="isCompact ? 'right-1.5 size-3.5' : 'right-2.5 size-4'"
                :stroke-width="1.5"
            />
        </div>
        <span v-if="description" :id="descriptionId" class="sr-only">{{ description }}</span>
    </div>
</template>
