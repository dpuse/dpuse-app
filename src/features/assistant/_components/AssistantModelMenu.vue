<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronDownIcon } from '@lucide/vue';
import { onUnmounted, ref, useTemplateRef } from 'vue';

// ── Local Framework
import type { AssistantModelConfig } from '../chat/modelConfigs';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ListItemButton from '@/components/ui/button/ListItemButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelConfig, modelConfigs } = defineProps<{ modelConfig: AssistantModelConfig; modelConfigs: AssistantModelConfig[] }>();

const emit = defineEmits<{ select: [modelConfig: AssistantModelConfig] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menuIsOpen = ref(false);
const menuReference = useTemplateRef<HTMLElement>('menuReference');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

document.addEventListener('pointerdown', handleDocumentPointerDown, { capture: true });

onUnmounted(() => {
    document.removeEventListener('pointerdown', handleDocumentPointerDown, { capture: true });
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleDocumentPointerDown(event: PointerEvent): void {
    if (!menuIsOpen.value) return;
    const target = event.target as Element;
    if (menuReference.value?.contains(target) === true) return;
    menuIsOpen.value = false;
}

function handleSelect(newModelConfig: AssistantModelConfig): void {
    menuIsOpen.value = false;
    emit('select', newModelConfig);
}
</script>

<template>
    <div ref="menuReference" class="relative max-w-full min-w-0">
        <!-- max-w-full on both this box and the trigger is load-bearing: without it the button holds its max-content width and
             overlays whatever sits to its right when the pane narrows. -->
        <Button
            aria-haspopup="true"
            :aria-expanded="menuIsOpen"
            aria-label="Select model"
            class="flex max-w-full min-w-0 items-center gap-x-1 rounded-full px-2.5 py-1 text-xs text-selected-text hover:bg-selected-hover focus-visible:ring-1 focus-visible:ring-selected-ring"
            shape="minimal"
            @click="menuIsOpen = !menuIsOpen"
        >
            <!-- The model alone. The provider is how the menu below groups its choices, but every model label already
                 names its vendor, so repeating it here spent a second line of the composer's bar on nothing. -->
            <span class="min-w-0 truncate text-left">{{ modelConfig.modelLabel }}</span>
            <ChevronDownIcon class="size-3.5 flex-none" :stroke-width="1.5" />
        </Button>

        <div v-if="menuIsOpen" class="absolute bottom-full left-0 z-10 mb-1 min-w-56 rounded-md border border-separator bg-surface p-1 text-sm shadow-md" role="menu">
            <ListItemButton
                v-for="config in modelConfigs"
                :key="config.id"
                class="mt-0.5 flex flex-col items-start first:mt-0"
                :is-active="modelConfig.id === config.id"
                role="menuitem"
                @click="handleSelect(config)"
            >
                <!-- The provider reads as an overline above the model, which is the line being chosen. -->
                <span class="text-xs text-muted">{{ config.providerLabel }}</span>
                <span>{{ config.modelLabel }}</span>
            </ListItemButton>
        </div>
    </div>
</template>
