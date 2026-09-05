<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import AssistantLogo from '@/components/branding/AssistantLogo.vue';
import Button from '@/components/ui/button/Button.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'k.toggle.label.aria': { en: 'Toggle assistant panel', es: 'Alternar el panel asistente' }
};
</script>

<template>
    <Button
        :aria-label="t(T, 'k.toggle.label.aria')"
        class="fixed top-(--safe-top-offset) right-(--safe-right-offset) z-20 rounded-full! bg-surface"
        data-region="AssistantPaneToggle"
        shape="icon"
    >
        <AssistantLogo />
    </Button>
</template>
