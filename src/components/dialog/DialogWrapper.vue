<script setup lang="ts">
// External Dependencies
import { LoaderCircleIcon } from 'lucide-vue-next';

// App Components - Statically imported so always available, even after app goes offline.
import DialogMask from '@/components/mask/DialogMask.vue';
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center">
        <DialogMask />

        <Suspense>
            <template #default>
                <slot />
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
