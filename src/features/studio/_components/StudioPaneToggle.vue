<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import ToggleButton from '@/components/ui/button/ToggleButton.vue';
import DPUseLogo from '@/components/branding/DPUseLogo.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'toggle.aria': { en: 'Toggle studio panel', es: 'Alternar panel de estudio' }
};
</script>

<template>
    <ToggleButton :accessible-label="t(T, 'toggle.aria')" class="fixed top-(--safe-top-offset) left-(--safe-left-offset) z-40" data-region="StudioPaneToggle">
        <DPUseLogo />
    </ToggleButton>
</template>
