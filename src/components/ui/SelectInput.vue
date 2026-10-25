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
    isCompact?: boolean; // Sized and framed for a toolbar: small text, no border until hovered, as wide as its value.
    isDefault?: boolean; // The value is a default the user has not chosen, so it shows in muted italics. The option's text must say so too.
    label: string;
    labelHidden?: boolean;
    options?: SelectOption[];
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
</script>

<template>
    <div data-region="SelectInput">
        <!-- Label -->
        <label :for="selectId" :class="labelHidden ? 'sr-only' : 'mb-1 block text-xs font-medium text-muted'">{{ label }}</label>

        <!-- Select ─ The browser's own control, for its keyboard, screen reader and touch support. 'appearance-none' drops
             its arrow, which cannot be styled, for a chevron drawn over it. A compact select sizes to its value
             ('field-sizing-content') where the browser can, and otherwise to its widest option.
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
                class="max-w-full min-w-0 cursor-pointer appearance-none truncate rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
                :class="[
                    isCompact
                        ? 'field-sizing-content h-7 border border-transparent bg-transparent pr-6 pl-1.5 text-xs enabled:hover:state-hover'
                        : 'h-9 w-full border border-boundary bg-surface pr-8 pl-2.5 text-sm',
                    isDefault ? 'text-muted italic' : 'text-content'
                ]"
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
