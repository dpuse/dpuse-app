<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import ToggleButton from '@/components/ui/action/ToggleButton.vue';
import DPUseLogo from '@/components/branding/DPUseLogo.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'toggle.aria': { en: 'Toggle studio panel', es: 'Alternar panel de estudio' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isOpen } = defineProps<{ isOpen: boolean }>(); // Whether the pane is on screen, so on a narrow display only the one in front.
</script>

<template>
    <ToggleButton :accessible-label="t(TEXT, 'toggle.aria')" class="fixed top-(--safe-top-offset) left-(--safe-left-offset) z-40" data-region="StudioPaneToggle" :is-open="isOpen">
        <DPUseLogo />
    </ToggleButton>
</template>
