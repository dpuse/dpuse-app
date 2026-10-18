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
        <!-- The spinner stays outside the transition, so a slow load does not fade into and out of it. The old view fades
             out quickly before the new one fades in, so it does not vanish in a flash. The header and task bar change
             on the click, so for that moment the old view sits under the new header. The first view after a page load
             does not fade in ('appear'), because Chrome does not count it towards Largest Contentful Paint until it is
             visible, which delays LCP by the length of the fade. -->
        <ComponentLoadingSpinner v-if="isLoading" v-bind="$attrs" />
        <Transition v-else name="action-fade" mode="out-in">
            <slot :component="Component" />
        </Transition>
    </RouterView>
</template>
