<script setup lang="ts">
// Local (App) Framework
import { displayIsWide } from '@/state/appLayout';

// Local Components - Static
import WorkbenchOptionPanel from './WorkbenchOptionPanel.vue';

// Options, Properties, Slots & Emits
defineProps<{ isVisible?: boolean }>();
defineEmits<{ continue: [] }>();
</script>

<template>
    <div class="h-full">
        <WorkbenchOptionPanel v-if="displayIsWide" class="flex" @continue="$emit('continue')" />

        <Transition appear name="horizontal-slide-ltr">
            <div v-if="!displayIsWide && isVisible" class="fixed inset-0 z-30">
                <div class="bg-surface/70 absolute inset-0" role="button" tabIndex="-1" @click="$emit('continue')" @keydown="$emit('continue')" />

                <WorkbenchOptionPanel class="dpuse-horizontal-slide-ltr-element relative mr-auto shadow-md" @continue="$emit('continue')" />
            </div>
        </Transition>
    </div>
</template>
