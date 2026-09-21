<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import DPUseLogo from '@/components/branding/DPUseLogo.vue';
import ToggleButton from '@/components/ui/action/ToggleButton.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'toggle.aria': { en: 'Toggle studio panel', es: 'Alternar panel de estudio' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isOpen } = defineProps<{ isOpen: boolean }>(); // Whether the pane is on screen, so on a narrow display only the one in front.
</script>

<template>
    <!-- The logo is wide, so it takes the same height as the Assistant logo rather than the same square box, which would
         leave it shorter; the side padding narrows to fit it, keeping the button a 40px circle. -->
    <ToggleButton
        :accessible-label="t(TEXT, 'toggle.aria')"
        class="fixed top-(--safe-top-offset) left-(--safe-left-offset) z-40 px-1.5!"
        data-region="StudioPaneToggle"
        :is-open="isOpen"
    >
        <DPUseLogo class="h-5.5! w-auto!" />
    </ToggleButton>
</template>
