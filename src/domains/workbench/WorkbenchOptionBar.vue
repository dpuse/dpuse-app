<script setup lang="ts">
// App Core
import { displayIsWide } from '@/state/appLayout';

// App Components - Statically imported.
import WorkbenchOptionBarContent from './WorkbenchOptionBarContent.vue';

// Properties & Emits
defineEmits<{ (event: 'continue'): void }>();
</script>

<template>
    <div>
        <WorkbenchOptionBarContent v-if="displayIsWide" class="flex" @continue="$emit('continue')" />

        <Transition appear name="horizontal-slide-ltr">
            <div v-if="!displayIsWide" class="fixed inset-0 z-30 flex">
                <div class="bg-surface/70 absolute inset-0" role="button" tabIndex="-1" @click="$emit('continue')" @keydown="$emit('continue')" />

                <WorkbenchOptionBarContent class="dpuse-horizontal-slide-ltr-element relative mr-auto flex shadow-md" @continue="$emit('continue')" />
            </div>
        </Transition>
    </div>
</template>
