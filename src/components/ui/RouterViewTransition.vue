<script setup lang="ts">
// ── External Dependencies & Registrations
import type { VNode } from 'vue';

// ── Static Components
import ComponentLoadingSpinner from '@/components/ui/placeholder/ComponentLoadingSpinner.vue'; // Static, so it can show while the view's chunk loads.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Attributes go to the spinner, because the view itself is rendered by the slot and takes its attributes there.
defineOptions({ inheritAttrs: false });

const { isLoading } = defineProps<{ isLoading: boolean }>();

// The slot must render a single keyed element. The key decides which route changes replay the fade.
defineSlots<{ default: (slotProperties: { component: VNode }) => unknown }>();
</script>

<template>
    <RouterView v-slot="{ Component }">
        <!-- The spinner stays outside the transition, so a slow load does not fade into and out of it. The old view is
             hidden at once rather than faded out: the header and task bar change on the click, so a fading old view
             would sit under the new header, shifted by any bar that came or went. -->
        <ComponentLoadingSpinner v-if="isLoading" v-bind="$attrs" />
        <Transition v-else name="action-fade-in" mode="out-in">
            <slot :component="Component" />
        </Transition>
    </RouterView>
</template>
