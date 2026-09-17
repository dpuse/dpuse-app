<script setup lang="ts">
// ── External Dependencies & Registrations
import { LoaderCircleIcon } from '@lucide/vue';

// ── Local Framework
import { t } from '@/state/locale';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'loading.aria': { en: 'Loading', es: 'Cargando' }
};
</script>

<template>
    <!-- No padding of its own: the parent already positions this, and panels can be as narrow as 64px, where any
         padding here would compound with theirs. Height is floored but width never is, so it fits whatever it is given.
         The label is carried on 'role="status"' rather than shown, because no wording survives 64px minus the parent's
         own padding, and a truncated message reads as a rendering fault rather than a state. -->
    <div :aria-label="t(TEXT, 'loading.aria')" class="grid min-h-10 w-full min-w-0 flex-1 place-items-center" data-region="ComponentLoadingSpinner" role="status">
        <LoaderCircleIcon aria-hidden="true" class="size-5 animate-spin text-muted" />
    </div>
</template>
