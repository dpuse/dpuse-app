<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './AssistantPaneToggle_.json';

// ── Static Components
import AssistantLogo from '@/components/branding/AssistantLogo.vue';
import ToggleButton from '@/components/ui/action/ToggleButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { isOpen } = defineProps<{ isOpen: boolean }>(); // Whether the assistant pane is on screen. A narrow display shows one pane at a time.
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
