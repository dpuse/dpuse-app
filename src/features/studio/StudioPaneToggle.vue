<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './StudioPaneToggle_.json';

// ── Static Components
import DPUseLogo from '@/components/branding/DPUseLogo.vue';
import ToggleButton from '@/components/ui/action/ToggleButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isOpen } = defineProps<{ isOpen: boolean }>(); // Whether the studio pane is on screen. A narrow display shows one pane at a time.
</script>

<template>
    <!-- The logo is wide, so it takes the Assistant logo's height rather than its square box, which would make it shorter.
         Narrower side padding fits it while keeping the button a 40px circle. 'z-40' keeps the button above the
         full-screen 'OptionBar' ('z-30') on a narrow display, where the assistant's toggle sits below it. -->
    <ToggleButton
        :accessible-label="t(TEXT, 'toggle.aria')"
        class="fixed top-(--safe-top-offset) left-(--safe-left-offset) z-40 px-1.5!"
        data-region="StudioPaneToggle"
        :is-open="isOpen"
    >
        <DPUseLogo class="h-5.5! w-auto!" />
    </ToggleButton>
</template>
