<script setup lang="ts">
// ── Local (App) Framework
import T from './HomeMenu.json';
import { t } from '@/state/locale';
import { viewportIsWide } from '@/state/appLayout';

// ── Local Components - Static
import ListItemButton from '@/components/ui/button/ListItemButton.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ continue: [] }>();
</script>

<template>
    <div
        class="overflow-hidden rounded-md border border-separator bg-surface shadow-md"
        :class="
            viewportIsWide
                ? 'fixed top-[calc(var(--safe-top-offset)+2.5rem+0.5rem)] left-[calc(env(safe-area-inset-left)+65px+0.5rem)] min-w-36'
                : 'fixed inset-x-0 bottom-0 mx-auto w-full max-w-sm rounded-t-2xl border-x border-t pb-[env(safe-area-inset-bottom)]'
        "
    >
        <div class="px-2 pt-1.5 pb-0.5 text-xs font-semibold text-muted">{{ t(T, 'Benchtop') }}</div>

        <div class="flex flex-col gap-y-1 p-1">
            <ListItemButton :to="{ name: 'workflow', query: { ...$route.query, wbView: 'workflow' } }" @click="emit('continue')">{{ t(T, 'Workflow') }}</ListItemButton>
            <ListItemButton :to="{ name: 'admin', query: { ...$route.query, wbView: 'admin' } }" @click="emit('continue')">{{ t(T, 'Admin') }}</ListItemButton>
            <ListItemButton :to="{ name: 'partner', query: { ...$route.query, wbView: 'partner' } }" @click="emit('continue')">{{ t(T, 'Partner') }}</ListItemButton>
        </div>
    </div>
</template>

<style scoped>
/* Desktop popover */
.dpuse-slide-down-enter-active,
.dpuse-slide-down-leave-active {
    transform-origin: top;
    will-change: transform, opacity;
    transition:
        transform 0.2s ease,
        opacity 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
    .dpuse-slide-down-enter-active,
    .dpuse-slide-down-leave-active {
        transition: none;
    }
}
.dpuse-slide-down-enter-from,
.dpuse-slide-down-leave-to {
    transform: scaleY(0.75) translateY(-6px);
    opacity: 0;
}
.dpuse-slide-down-enter-to,
.dpuse-slide-down-leave-from {
    transform: scaleY(1);
    opacity: 1;
}

/* Mobile bottom sheet */
.dpuse-sheet-enter-active,
.dpuse-sheet-leave-active {
    will-change: transform, opacity;
    transition:
        transform 0.3s cubic-bezier(0.32, 0.72, 0, 1),
        opacity 0.2s ease;
}
@media (prefers-reduced-motion: reduce) {
    .dpuse-sheet-enter-active,
    .dpuse-sheet-leave-active {
        transition: none;
    }
}
.dpuse-sheet-enter-from,
.dpuse-sheet-leave-to {
    transform: translateY(100%);
    opacity: 0;
}
.dpuse-sheet-enter-to,
.dpuse-sheet-leave-from {
    transform: translateY(0);
    opacity: 1;
}
</style>
