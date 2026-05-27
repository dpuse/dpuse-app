<script setup lang="ts">
// External Dependencies
import { LoaderCircleIcon, XIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import DialogMask from '@/components/ui/dialog/DialogMask.vue';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleClose(): Promise<void> {
    const rest = { ...route.query };
    delete rest.dlg;
    router.push({ query: { ...rest } });
}
</script>

<template>
    <div class="fixed inset-0 flex flex-col items-center justify-center" data-region="DialogShell">
        <DialogMask />

        <div
            aria-modal="true"
            class="relative flex h-full max-h-full w-full max-w-full flex-col bg-surface pt-[calc(env(safe-area-inset-top))] pr-[calc(env(safe-area-inset-right))] pl-[calc(env(safe-area-inset-left))] text-content md:absolute md:top-[5%] md:left-1/2 md:h-auto md:max-h-[90vh] md:w-3xl md:max-w-[calc(100vw-2rem)] md:-translate-x-1/2 md:rounded-lg md:p-0"
            role="dialog"
            style="container-type: inline-size"
            tabindex="-1"
        >
            <!-- Close Button -->
            <Button class="absolute top-[calc(env(safe-area-inset-top)+12px)] right-(--safe-right-offset) md:top-3 md:right-3" shape="icon" @click="handleClose">
                <XIcon stroke-width="1.25" />
            </Button>

            <!-- Content -->
            <!-- <Suspense>
                <template #default> -->
            <slot :close="handleClose" />
            <!-- </template>

                <template #fallback>
                    <div class="flex flex-1 items-center justify-center gap-x-1 text-zinc-500">
                        <LoaderCircleIcon class="animate-spin" />
                        <span>Loading component...</span>
                    </div>
                </template>
            </Suspense> -->
        </div>
    </div>
</template>
