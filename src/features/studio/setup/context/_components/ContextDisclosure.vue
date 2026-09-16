<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronRightIcon, SquarePenIcon } from '@lucide/vue';

// ── Local Framework
import { purifyText } from '@/services/useMarkedTool';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Expansion is driven by the list rather than held here, because only one row in a list is open at a time.
const { description, isExpanded, label } = defineProps<{ description: string; isExpanded: boolean; label: string }>();

defineEmits<{ edit: []; toggle: [] }>();
</script>

<template>
    <div class="mt-2 max-w-prose rounded-md border" :class="isExpanded ? 'border-separator' : 'border-backdrop'">
        <!-- Header -->
        <div
            role="button"
            tabindex="0"
            :aria-expanded="isExpanded"
            class="flex items-center gap-x-2 bg-backdrop py-2 pr-4 pl-2"
            :class="isExpanded ? 'rounded-t-md' : 'rounded-md'"
            @click="$emit('toggle')"
            @keydown.enter="$emit('toggle')"
            @keydown.space.prevent="$emit('toggle')"
        >
            <ChevronRightIcon class="size-5" stroke-width="1.5" />
            <div class="flex-1">{{ label }}</div>
            <slot name="actions" />
            <ActionWrapper @click="$emit('edit')">
                <SquarePenIcon class="size-5" stroke-width="1.5" />
            </ActionWrapper>
        </div>

        <!-- Body -->
        <div v-if="isExpanded" class="overflow-y-hidden rounded-b-md px-4 pb-4">
            <!-- Description -->
            <div v-html="purifyText(description)" />

            <slot />
        </div>
    </div>
</template>
