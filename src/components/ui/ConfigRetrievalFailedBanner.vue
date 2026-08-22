<script setup lang="ts">
// ── Local Framework
import Button from '@/components/ui/button/Button.vue';
import { t } from '@/state/locale';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    message: { en: 'Unable to connect to DPUse. Please refresh the page.', es: 'No se puede conectar con DPUse. Actualice la página.' },
    'refresh.label': { en: 'Refresh', es: 'Actualizar' }
};

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRefresh(): void {
    location.reload();
}
</script>

<template>
    <div class="flex items-center justify-center gap-3 bg-danger px-3 py-1.5 text-[15px] text-danger-text" data-region="ConfigRetrievalFailedBanner">
        <span>{{ t(T, 'message') }}</span>
        <Button size="sm" variant="neutral" @click="handleRefresh">{{ t(T, 'refresh.label') }}</Button>
    </div>
</template>
