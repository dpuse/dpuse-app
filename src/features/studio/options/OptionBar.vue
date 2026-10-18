<script setup lang="ts">
// ── Local Framework
import { viewportIsWide } from '@/state/device';

// ── Static Components
import OptionPanel from './OptionPanel.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineProps<{ isVisible?: boolean }>();

defineEmits<{ continue: [] }>();
</script>

<template>
    <div class="h-full" data-region="OptionBar">
        <OptionPanel v-if="viewportIsWide" class="flex" @continue="$emit('continue')" />

        <Transition appear name="dpuse-horizontal-slide-ltr">
            <div v-if="!viewportIsWide && isVisible" class="fixed inset-0">
                <!-- TODO: Could the following be converted to a common mask? -->
                <div class="absolute inset-0 mt-[env(safe-area-inset-top)] bg-overlay" role="button" tabIndex="-1" @click="$emit('continue')" @keydown="$emit('continue')" />

                <OptionPanel class="dpuse-horizontal-slide-ltr-element relative mr-auto shadow-md" @continue="$emit('continue')" />
            </div>
        </Transition>
    </div>
</template>
