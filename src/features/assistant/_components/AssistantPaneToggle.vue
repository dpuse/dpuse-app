<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import AssistantLogo from '@/components/branding/AssistantLogo.vue';
import ToggleButton from '@/components/ui/button/ToggleButton.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'k.toggle.label.aria': { en: 'Toggle assistant panel', es: 'Alternar el panel asistente' }
};
</script>

<template>
    <ToggleButton :accessible-label="t(T, 'k.toggle.label.aria')" class="fixed top-(--safe-top-offset) right-(--safe-right-offset) z-20" data-region="AssistantPaneToggle">
        <AssistantLogo />
    </ToggleButton>
</template>
