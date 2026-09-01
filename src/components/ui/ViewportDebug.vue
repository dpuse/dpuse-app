<script setup lang="ts">
// ── External Dependencies & Registrations
import { onUnmounted, ref } from 'vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Diagnostic only, and deliberately not wired to 'appLayout': it reports what the browser says rather than what the
// app believes, so a disagreement between the two is visible instead of hidden.

const readout = ref('');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Polled rather than driven by events, because a value that only updates when we already listen for the change cannot
// show a change we are failing to hear — which is the thing being diagnosed.
const timerId = setInterval(refresh, 250);

onUnmounted(() => {
    clearInterval(timerId);
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function refresh(): void {
    const visualViewport = window.visualViewport;
    const shell = document.querySelector('[data-region="App"]');
    const composer = document.querySelector('[data-region="TextArea"]')?.closest('.absolute');
    const focused = document.activeElement;
    readout.value = [
        `inner ${String(window.innerHeight)}`,
        `vv ${visualViewport ? String(Math.round(visualViewport.height)) : '—'} off ${visualViewport ? String(Math.round(visualViewport.offsetTop)) : '—'}`,
        `var ${document.documentElement.style.getPropertyValue('--viewport-height') || 'unset'}`,
        `shell ${shell ? String(Math.round(shell.getBoundingClientRect().height)) : '—'}`,
        `box top ${composer ? String(Math.round(composer.getBoundingClientRect().top)) : '—'}`,
        `focus ${focused ? focused.tagName.toLowerCase() : 'none'}`,
        `scrollY ${String(Math.round(window.scrollY))}`
    ].join('  ');
}
</script>

<template>
    <div class="fixed top-0 left-0 z-90 bg-black/80 px-1 py-0.5 font-mono text-[10px] leading-tight text-lime-300" data-region="ViewportDebug">
        {{ readout }}
    </div>
</template>
