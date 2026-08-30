<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { label = 'Working…' } = defineProps<{ label?: string }>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Must match the animation's duration in the style block below. The letters' delays are spread across exactly one
// full cycle, which is what makes the wave wrap: the first letter starts brightening as the last one fades, so the
// word never dips all at once. A fixed per-letter delay shorter than the cycle leaves every letter in the trough
// together, which is the flat spot that reads as a blink.
const CYCLE_MS = 1600;

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Segmented rather than spread or split, so a character built from several code points — an emoji, an accent written
// separately — stays one character and animates as one.
const characters = computed(() => [...new Intl.Segmenter().segment(label)].map((segment) => segment.segment));

const letterDelayMs = computed(() => CYCLE_MS / characters.value.length);
</script>

<template>
    <!-- One span per letter, each running the same animation a little later than its neighbour, which walks the
         brightness across the word from left to right. A single travelling edge cannot do this without a gap: it has
         to finish clearing the word before it can start drawing it again, and that gap is the blank. Here the letters
         overlap in phase, so something is always lit. Read as a whole word rather than letter by letter, hence the
         label on the box and the hidden spans. -->
    <div :aria-label="label" role="status">
        <span
            v-for="(character, index) in characters"
            :key="index"
            aria-hidden="true"
            class="dpuse-pending-letter"
            :style="{ animationDelay: `${String(Math.round(index * letterDelayMs))}ms` }"
            >{{ character }}</span
        >
    </div>
</template>

<style scoped>
.dpuse-pending-letter {
    animation: dpuse-pending-letter 1600ms ease-in-out infinite;
}
/* Dims rather than vanishes: at full transparency the trough between waves reads as a flicker, and the word stops
   being readable while it waits. */
@keyframes dpuse-pending-letter {
    0%,
    100% {
        opacity: 0.25;
    }
    40% {
        opacity: 1;
    }
}
@media (prefers-reduced-motion: reduce) {
    .dpuse-pending-letter {
        animation: none;
    }
}
</style>
