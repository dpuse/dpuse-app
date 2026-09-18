<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import AssistantLogo from '@/components/branding/AssistantLogo.vue';
import ToggleButton from '@/components/ui/action/ToggleButton.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'toggle.aria': { en: 'Toggle assistant panel', es: 'Alternar el panel asistente' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isOpen } = defineProps<{ isOpen: boolean }>(); // Whether the pane is on screen, so on a narrow display only the one in front.
</script>

<template>
    <ToggleButton
        :accessible-label="t(TEXT, 'toggle.aria')"
        class="fixed top-(--safe-top-offset) right-(--safe-right-offset) z-20"
        data-region="AssistantPaneToggle"
        :is-open="isOpen"
    >
        <AssistantLogo />
    </ToggleButton>
</template>
