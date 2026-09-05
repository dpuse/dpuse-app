<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import DPUseLogo from '@/components/branding/DPUseLogo.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'wb.toggle.label.aria': { en: 'Toggle studio panel', es: 'Alternar panel de estudio' }
};
</script>

<template>
    <Button
        :aria-label="t(T, 'wb.toggle.label.aria')"
        class="fixed top-(--safe-top-offset) left-(--safe-left-offset) z-40 rounded-full!"
        data-region="StudioPaneToggle"
        shape="icon"
    >
        <DPUseLogo />
    </Button>
</template>
