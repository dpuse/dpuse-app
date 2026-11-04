<script setup lang="ts">
// ── External Dependencies & Registrations
import { type Component, computed } from 'vue';

// ── Local Framework
import { TEXT } from './ColumnMenu_.json';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import { Menu } from '@/components/ui/menu';
import type { SelectOption } from '@/components/ui/SelectInput.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface MenuChoiceGroup {
    id: string;
    label: string | undefined; // Undefined for choices listed under the menu group's own label.
    options: SelectOption[];
}

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

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const buttonLabel = computed(() => t(TEXT, isTypeChosen ? 'menu.chosen.aria' : 'menu.aria', { label: columnLabel, type: typeText }));

// ── Type ─ Choices next to each other with the same group label, such as the kinds of number, form one group.
const typeGroups = computed((): MenuChoiceGroup[] => {
    const groups: MenuChoiceGroup[] = [];
    for (const option of typeOptions) {
        const lastGroup = groups.at(-1);
        if (lastGroup != null && lastGroup.label === option.groupLabel) lastGroup.options.push(option);
        else groups.push({ id: option.id, label: option.groupLabel, options: [option] });
    }
    return groups;
});

const nullWordsLabel = computed(() => t(TEXT, 'nullWords.label', { count: new Intl.NumberFormat(localeId.value).format(nullWordValueCount) }));
</script>

<template>
    <Menu.Root class="flex flex-none">
        <!-- Type Icon ─ The button for the column's menu. Its name says the type, because the icon alone does not.
             '-mr-1' cancels its padding, so the icon lines up with the cell's edge. -->
        <template #trigger="{ triggerAttributes }">
            <ActionWrapper
                v-bind="triggerAttributes"
                :aria-label="buttonLabel"
                class="relative -mr-1 ml-0.5 flex flex-none items-center rounded-md p-1 text-sm text-muted hover:state-hover active:state-press"
                data-region="ColumnMenu"
                :title="buttonLabel"
            >
                <component :is="typeIcon" aria-hidden="true" class="size-[1.25em] flex-none" />
                <span v-if="isTypeChosen" aria-hidden="true" class="absolute top-0.5 right-0.5 size-2 rounded-full bg-muted" />
            </ActionWrapper>
        </template>

        <Menu.Content class="min-w-48" :label="buttonLabel" placement="bottom-end">
            <!-- Type -->
            <Menu.Group :label="t(TEXT, 'type.label')">
                <template v-for="group in typeGroups" :key="group.id">
                    <Menu.Group v-if="group.label != null" :label="group.label">
                        <Menu.Item
                            v-for="option in group.options"
                            :key="option.id"
                            :is-checked="option.id === typeValue"
                            :is-disabled="isDisabled"
                            kind="radio"
                            @select="emit('update:typeValue', option.id)"
                        >
                            {{ option.label }}
                        </Menu.Item>
                    </Menu.Group>
                    <Menu.Item
                        v-for="option in group.options"
                        v-else
                        :key="option.id"
                        :is-checked="option.id === typeValue"
                        :is-disabled="isDisabled"
                        kind="radio"
                        @select="emit('update:typeValue', option.id)"
                    >
                        {{ option.label }}
                    </Menu.Item>
                </template>
            </Menu.Group>

            <!-- Decimal Separator ─ Only for a column of numbers. -->
            <template v-if="decimalSeparatorOptions.length > 0">
                <Menu.Separator />
                <Menu.Group :label="t(TEXT, 'decimalSeparator.label')">
                    <Menu.Item
                        v-for="option in decimalSeparatorOptions"
                        :key="option.id"
                        :is-checked="option.id === decimalSeparatorValue"
                        :is-disabled="isDisabled"
                        kind="radio"
                        @select="emit('update:decimalSeparatorValue', option.id)"
                    >
                        {{ option.label }}
                    </Menu.Item>
                </Menu.Group>
            </template>

            <!-- Null Words ─ Only for a text column. Off by default, because in a text column 'NA' can be data, such as
                 Namibia's country code. -->
            <template v-if="nullWordReading != null">
                <Menu.Separator />
                <Menu.Item
                    :is-checked="nullWordReading === 'empty'"
                    :is-disabled="isDisabled"
                    kind="checkbox"
                    @select="emit('update:nullWordsAreEmpty', nullWordReading !== 'empty')"
                >
                    {{ nullWordsLabel }}
                </Menu.Item>
            </template>

            <!-- Show Detail ─ The empty icon lines its label up with the ticked choices above it. -->
            <Menu.Separator />
            <Menu.Item @select="emit('showDetail')">
                <template #icon><span aria-hidden="true" class="size-3.5 flex-none" /></template>
                {{ t(TEXT, 'detail.label') }}
            </Menu.Item>
        </Menu.Content>
    </Menu.Root>
</template>
