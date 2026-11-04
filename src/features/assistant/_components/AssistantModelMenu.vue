<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronDownIcon } from '@lucide/vue';

import { t } from '@/state/locale';
import { TEXT } from './AssistantModelMenu_.json';

// ── Local Framework
import type { AssistantModelConfig } from '../chat/modelConfigs';
import { UNSELECTED_CLASSES } from '@/components/ui/action/action';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import { Menu } from '@/components/ui/menu';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelConfig, modelConfigs } = defineProps<{ modelConfig: AssistantModelConfig; modelConfigs: AssistantModelConfig[] }>();

const emit = defineEmits<{ select: [modelConfig: AssistantModelConfig] }>();
</script>

<template>
    <!-- max-w-full on both this box and the trigger is load-bearing: without it the button holds its max-content width and
         overlays whatever sits to its right when the pane narrows. -->
    <Menu.Root class="max-w-full min-w-0">
        <template #trigger="{ triggerAttributes }">
            <ActionWrapper
                v-bind="triggerAttributes"
                :aria-label="t(TEXT, 'selectModel.aria', { model: modelConfig.modelLabel })"
                class="flex max-w-full min-w-0 items-center gap-x-1 rounded-full px-2.5 py-1 text-xs text-content focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                :class="UNSELECTED_CLASSES"
            >
                <!-- The model alone. The provider is how the menu below groups its choices, but every model label already
                     names its vendor, so repeating it here spent a second line of the composer's bar on nothing. -->
                <span class="min-w-0 truncate text-left">{{ modelConfig.modelLabel }}</span>
                <ChevronDownIcon aria-hidden="true" class="size-3.5 flex-none" :stroke-width="1.5" />
            </ActionWrapper>
        </template>

        <Menu.Content class="min-w-56" :label="t(TEXT, 'models.aria')" placement="top-start">
            <Menu.Item v-for="config in modelConfigs" :key="config.id" :is-checked="modelConfig.id === config.id" kind="radio" @select="emit('select', config)">
                <!-- The provider reads as an overline above the model, which is the line being chosen. -->
                <span class="block text-xs text-muted">{{ config.providerLabel }}</span>
                <span class="block">{{ config.modelLabel }}</span>
            </Menu.Item>
        </Menu.Content>
    </Menu.Root>
</template>
