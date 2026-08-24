<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute, useRouter } from 'vue-router';

// ── Static Components
import CloseButton from '@/components/ui/button/CloseButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { variant = 'large' } = defineProps<{ variant?: 'compact' | 'large' }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleClose(): Promise<void> {
    const routeQueryParameters = { ...route.query };
    delete routeQueryParameters.dlg;
    await router.push({ query: { ...routeQueryParameters } });
}
</script>

<template>
    <div
        aria-modal="true"
        :class="[
            'relative flex size-full flex-col bg-surface text-content',
            'md:absolute md:top-6 md:left-1/2 md:max-h-[calc(100%-48px)] md:-translate-x-1/2 md:rounded-lg',
            'pt-[calc(env(safe-area-inset-top))] pr-[calc(env(safe-area-inset-right))] pl-[calc(env(safe-area-inset-left))]',
            variant === 'compact' ? 'md:h-auto md:w-sm' : 'md:w-3xl md:max-w-[calc(100vw-2rem)]'
        ]"
        data-region="DialogModal"
        role="dialog"
        style="container-type: inline-size"
        tabindex="-1"
    >
        <slot />

        <CloseButton class="absolute top-[calc(env(safe-area-inset-top)+12px)] right-(--safe-right-offset) md:top-3 md:right-3" @click="handleClose" />
    </div>
</template>
