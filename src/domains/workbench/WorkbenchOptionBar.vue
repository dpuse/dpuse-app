<script setup lang="ts">
// Local (App) Framework
import { viewportIsWide } from '@/state/appLayout';

// Local Components - Static
import WorkbenchOptionPanel from './WorkbenchOptionPanel.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

defineProps<{ isVisible?: boolean }>();

defineEmits<{ continue: [] }>();
</script>

<template>
    <div class="h-full" data-component="WorkbenchOptionBar">
        <WorkbenchOptionPanel v-if="viewportIsWide" class="flex" @continue="$emit('continue')" />

        <Transition appear name="horizontal-slide-ltr">
            <div v-if="!viewportIsWide && isVisible" class="fixed inset-0 z-30">
                <!-- TODO: Could the following be converted to a common mask? -->
                <div class="bg-overlay absolute inset-0 z-45" role="button" tabIndex="-1" @click="$emit('continue')" @keydown="$emit('continue')" />

                <WorkbenchOptionPanel class="dpuse-horizontal-slide-ltr-element relative mr-auto shadow-md" @continue="$emit('continue')" />
            </div>
        </Transition>
    </div>
</template>
