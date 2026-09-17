<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronRightIcon, SquarePenIcon } from '@lucide/vue';

// ── Local Framework
import { purifyText } from '@/services/useMarkedTool';
import { T } from './ContextDisclosure_.json';
import { t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Expansion is driven by the list rather than held here, because only one row in a list is open at a time.
const { description, isExpanded, label } = defineProps<{ description: string; isExpanded: boolean; label: string }>();

defineSlots<{
    actions(): unknown; // Rendered in the header before the edit button.
    default(): unknown; // Rendered below the description while expanded.
}>();

defineEmits<{ edit: []; toggle: [] }>();
</script>

<template>
    <div class="mt-2 max-w-prose rounded-md border" :class="isExpanded ? 'border-separator' : 'border-backdrop'">
        <!-- Header -->
        <div class="flex items-center gap-x-2 bg-backdrop pr-4" :class="isExpanded ? 'rounded-t-md' : 'rounded-md'">
            <h3 class="min-w-0 flex-1 text-base! font-normal! tracking-normal!">
                <ActionWrapper
                    :aria-expanded="isExpanded"
                    class="flex w-full items-center gap-x-2 py-2 pl-2 text-left"
                    :class="isExpanded ? 'rounded-tl-md' : 'rounded-l-md'"
                    @click="$emit('toggle')"
                >
                    <ChevronRightIcon class="size-5 flex-none transition-transform" :class="{ 'rotate-90': isExpanded }" stroke-width="1.5" />
                    <span>{{ label }}</span>
                </ActionWrapper>
            </h3>

            <!-- Actions -->
            <div class="flex items-center">
                <slot name="actions" />
                <ActionWrapper :aria-label="t(T, 'edit.aria', { label })" @click="$emit('edit')">
                    <SquarePenIcon class="size-5" stroke-width="1.5" />
                </ActionWrapper>
            </div>
        </div>

        <!-- Body -->
        <div v-if="isExpanded" class="overflow-y-hidden rounded-b-md px-4 pb-4">
            <!-- Description -->
            <div v-html="purifyText(description)" />

            <slot />
        </div>
    </div>
</template>
