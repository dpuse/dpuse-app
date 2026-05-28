<script setup lang="ts">
// External Dependencies
import { XIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleClose(): Promise<void> {
    const routeQueryParameters = { ...route.query };
    delete routeQueryParameters.dlg;
    router.push({ query: { ...routeQueryParameters } });
}
</script>

<template>
    <div class="fixed inset-0 flex flex-col items-center justify-center" data-region="DialogLayout">
        <div
            aria-modal="true"
            class="relative flex h-full max-h-full w-full max-w-full flex-col bg-surface pt-[calc(env(safe-area-inset-top))] pr-[calc(env(safe-area-inset-right))] pl-[calc(env(safe-area-inset-left))] text-content md:absolute md:top-[5%] md:left-1/2 md:h-auto md:max-h-[90vh] md:w-3xl md:max-w-[calc(100vw-2rem)] md:-translate-x-1/2 md:rounded-lg md:p-0"
            data-region="dialogPanel"
            role="dialog"
            style="container-type: inline-size"
            tabindex="-1"
        >
            <Button class="absolute top-[calc(env(safe-area-inset-top)+12px)] right-(--safe-right-offset) md:top-3 md:right-3" shape="icon" @click="handleClose">
                <XIcon stroke-width="1.25" />
            </Button>

            <slot :close="handleClose" />
        </div>
    </div>
</template>
