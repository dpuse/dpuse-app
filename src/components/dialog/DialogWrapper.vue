<script setup lang="ts">
// External Dependencies
import { LoaderCircleIcon, XIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import DialogMask from '@/components/mask/DialogMask.vue';

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();
const router = useRouter();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleCloseDialog(): Promise<void> {
    const rest = { ...route.query };
    delete rest.dlg;
    router.push({ query: { ...rest } });
}
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center">
        <DialogMask />

        <Suspense>
            <template #default>
                <div
                    aria-modal="true"
                    class="bg-surface text-content z-10 flex h-full max-h-full w-full max-w-full flex-col pt-[calc(env(safe-area-inset-top))] pr-[calc(env(safe-area-inset-right))] pl-[calc(env(safe-area-inset-left))] sm:absolute sm:top-[5%] sm:left-1/2 sm:h-auto sm:max-h-[90vh] sm:w-3xl sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:rounded-lg"
                    role="dialog"
                    tabindex="-1"
                >
                    <!-- Close Button -->
                    <Button class="absolute top-[calc(env(safe-area-inset-top)+12px)] right-[calc(env(safe-area-inset-right)+12px)]" variant="iconLarge" @click="handleCloseDialog">
                        <XIcon stroke-width="1.25" />
                    </Button>

                    <!-- Content -->
                    <slot />
                </div>
            </template>

            <template #fallback>
                <div
                    class="bg-surface z-10 flex h-full max-h-full w-full max-w-full gap-x-1 overflow-hidden overflow-y-auto overscroll-y-none text-zinc-500 sm:absolute sm:top-[5%] sm:left-1/2 sm:h-auto sm:max-h-[90vh] sm:w-sm sm:-translate-x-1/2 sm:rounded-lg"
                >
                    <LoaderCircleIcon class="animate-spin" />
                    Loading component...
                </div>
            </template>
        </Suspense>
    </div>
</template>
