<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronDownIcon } from '@lucide/vue';
import { onUnmounted, ref, useTemplateRef } from 'vue';

// ── Local Framework
import type { AssistantModelConfig, AssistantVendorConfig, AssistantVendorId } from '../chat/modelConfigs';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ListItemButton from '@/components/ui/button/ListItemButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { modelConfig, vendorConfigs, vendorId } = defineProps<{ modelConfig: AssistantModelConfig; vendorConfigs: AssistantVendorConfig[]; vendorId: AssistantVendorId }>();

const emit = defineEmits<{ select: [vendorId: AssistantVendorId, modelConfig: AssistantModelConfig] }>();

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

function handleSelect(newVendorId: AssistantVendorId, newModelConfig: AssistantModelConfig): void {
    menuIsOpen.value = false;
    emit('select', newVendorId, newModelConfig);
}
</script>

<template>
    <div ref="menuReference" class="relative">
        <Button
            aria-haspopup="true"
            :aria-expanded="menuIsOpen"
            aria-label="Select vendor and model"
            class="flex items-center gap-x-1 rounded-full bg-zinc-200 px-2.5 py-1 text-xs dark:bg-zinc-700"
            shape="minimal"
            @click="menuIsOpen = !menuIsOpen"
        >
            <span>{{ modelConfig.providerLabel }} · {{ modelConfig.modelId }}</span>
            <ChevronDownIcon class="size-3.5" :stroke-width="1.5" />
        </Button>

        <div v-if="menuIsOpen" class="absolute bottom-full left-0 z-10 mb-1 min-w-56 rounded-md border border-separator bg-surface p-1 text-sm shadow-md" role="menu">
            <template v-for="vendorConfig in vendorConfigs" :key="vendorConfig.id">
                <div class="mt-1.5 px-2 text-xs font-medium tracking-wide text-subtle uppercase first:mt-0.5">{{ vendorConfig.label }}</div>
                <ListItemButton
                    v-for="config in vendorConfig.modelConfigs"
                    :key="config.id"
                    class="mt-0.5 flex flex-col items-start"
                    :is-active="vendorId === vendorConfig.id && modelConfig.id === config.id"
                    role="menuitem"
                    @click="handleSelect(vendorConfig.id, config)"
                >
                    <span>{{ config.providerLabel }}</span>
                    <span class="text-xs text-muted">{{ config.modelId }}</span>
                </ListItemButton>
            </template>
        </div>
    </div>
</template>
