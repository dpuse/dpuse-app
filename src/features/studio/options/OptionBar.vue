<script setup lang="ts">
// ── Local Framework
import { viewportIsWide } from '@/state/appLayout';

// ── Static Components
import OptionPanel from './OptionPanel.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineProps<{ isVisible?: boolean }>();

defineEmits<{ continue: [] }>();
</script>

<template>
    <div class="h-full" data-region="OptionBar">
        <OptionPanel v-if="viewportIsWide" class="flex" @continue="$emit('continue')" />

        <Transition appear name="horizontal-slide-ltr">
            <div v-if="!viewportIsWide && isVisible" class="fixed inset-0">
                <!-- TODO: Could the following be converted to a common mask? -->
                <div class="absolute inset-0 mt-[env(safe-area-inset-top)] bg-overlay" role="button" tabIndex="-1" @click="$emit('continue')" @keydown="$emit('continue')" />

                <OptionPanel class="dpuse-horizontal-slide-ltr-element relative mr-auto shadow-md" @continue="$emit('continue')" />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
/*
 * Vue Transition - Horizontal slide left to right.
 * Two-class pattern: outer selector fades the wrapper (opacity), inner
 * .dpuse-horizontal-slide-ltr-element selector slides the content (transform).
 * Decoupling the two allows independent timing without compositing issues.
 */
.horizontal-slide-ltr-enter-active,
.horizontal-slide-ltr-leave-active {
    transition: opacity 220ms ease-in-out;
}
.horizontal-slide-ltr-enter-from,
.horizontal-slide-ltr-leave-to {
    opacity: 0;
}
.horizontal-slide-ltr-enter-active .dpuse-horizontal-slide-ltr-element,
.horizontal-slide-ltr-leave-active .dpuse-horizontal-slide-ltr-element {
    transition: transform 260ms ease-in-out;
}
.horizontal-slide-ltr-enter-from .dpuse-horizontal-slide-ltr-element,
.horizontal-slide-ltr-leave-to .dpuse-horizontal-slide-ltr-element {
    transform: translateX(-100%);
}
@media (prefers-reduced-motion: reduce) {
    .horizontal-slide-ltr-enter-active,
    .horizontal-slide-ltr-leave-active {
        transition: none;
    }
    .horizontal-slide-ltr-enter-active .dpuse-horizontal-slide-ltr-element,
    .horizontal-slide-ltr-leave-active .dpuse-horizontal-slide-ltr-element {
        transition: none;
    }
}

/*
 * Vue Transition - Horizontal slide right to left.
 * Same two-class pattern as horizontal-slide-ltr above.
 */
/* .horizontal-slide-rtl-enter-active,
.horizontal-slide-rtl-leave-active {
    transition: opacity 220ms ease-in-out;
}
.horizontal-slide-rtl-enter-from,
.horizontal-slide-rtl-leave-to {
    opacity: 0;
}
.horizontal-slide-rtl-enter-active .dpuse-horizontal-slide-rtl-element,
.horizontal-slide-rtl-leave-active .dpuse-horizontal-slide-rtl-element {
    transition: transform 260ms ease-in-out;
}
.horizontal-slide-rtl-enter-from .dpuse-horizontal-slide-rtl-element,
.horizontal-slide-rtl-leave-to .dpuse-horizontal-slide-rtl-element {
    transform: translateX(100%);
}
@media (prefers-reduced-motion: reduce) {
    .horizontal-slide-rtl-enter-active,
    .horizontal-slide-rtl-leave-active {
        transition: none;
    }
    .horizontal-slide-rtl-enter-active .dpuse-horizontal-slide-rtl-element,
    .horizontal-slide-rtl-leave-active .dpuse-horizontal-slide-rtl-element {
        transition: none;
    }
} */
</style>
