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

const { auditChoices, disabled } = defineProps<{
    auditChoices: AuditChoice[];
    disabled: boolean;
}>();

defineSlots<{
    default(): unknown; // The trigger's text: how much of the item has been audited, so the amount is the button that audits more.
}>();

const emit = defineEmits<{
    select: [byteLimit: number | undefined];
}>();
</script>

<template>
    <Menu.Root class="flex-none">
        <template #trigger="{ triggerAttributes }">
            <ActionWrapper
                v-bind="triggerAttributes"
                class="flex h-7 min-w-0 items-center gap-x-0.5 rounded-md px-1.5 text-accent hover:state-hover active:state-press disabled:text-muted"
                :disabled="disabled"
                :title="t(TEXT, 'audit.label')"
            >
                <span class="sr-only">{{ t(TEXT, 'audit.label') }}</span>
                <slot />
                <ChevronDownIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
            </ActionWrapper>
        </template>
        <Menu.Content :label="t(TEXT, 'audit.aria')" placement="bottom-end">
            <Menu.Item v-for="auditChoice in auditChoices" :key="auditChoice.id" @select="emit('select', auditChoice.byteLimit)">{{ auditChoice.label }}</Menu.Item>
        </Menu.Content>
    </Menu.Root>
</template>
