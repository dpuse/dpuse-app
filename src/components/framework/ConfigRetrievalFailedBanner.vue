<script setup lang="ts">
// ── Local Framework
import Button from '@/components/ui/button/Button.vue';
import T from './ConfigRetrievalFailedBanner.json';
import { t } from '@/state/locale';

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
