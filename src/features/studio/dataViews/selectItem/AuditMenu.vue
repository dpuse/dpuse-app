<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronDownIcon } from '@lucide/vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './AuditMenu_.json';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import { Menu } from '@/components/ui/menu';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface AuditChoice {
    byteLimit: number | undefined; // Undefined audits the whole item.
    id: string;
    label: string;
}

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { auditChoices, disabled, isLabelHidden } = defineProps<{
    auditChoices: AuditChoice[];
    disabled: boolean;
    isLabelHidden?: boolean; // Shows just the icon and arrow, for a toolbar short of room. The label is still read out, and shows as a tooltip.
}>();

defineSlots<{
    default(): unknown; // The trigger's icon.
}>();

const emit = defineEmits<{
    select: [byteLimit: number | undefined];
}>();
</script>

<template>
    <!-- Looks like the toolbar's compact selects beside it: an icon, a label that truncates, and an arrow. -->
    <Menu.Root class="flex">
        <template #trigger="{ triggerAttributes }">
            <ActionWrapper
                v-bind="triggerAttributes"
                class="flex h-7 max-w-full min-w-0 items-center gap-x-1 rounded-md px-1.5 text-sm text-content hover:state-hover active:state-press disabled:opacity-50"
                :disabled="disabled"
                :title="isLabelHidden ? t(TEXT, 'audit.label') : undefined"
            >
                <slot />
                <span class="min-w-0 truncate" :class="{ 'sr-only': isLabelHidden }">{{ t(TEXT, 'audit.label') }}</span>
                <ChevronDownIcon aria-hidden="true" class="size-3.5 flex-none text-muted" :stroke-width="1.5" />
            </ActionWrapper>
        </template>
        <Menu.Content :label="t(TEXT, 'audit.aria')" placement="bottom-start">
            <Menu.Item v-for="auditChoice in auditChoices" :key="auditChoice.id" @select="emit('select', auditChoice.byteLimit)">{{ auditChoice.label }}</Menu.Item>
        </Menu.Content>
    </Menu.Root>
</template>
