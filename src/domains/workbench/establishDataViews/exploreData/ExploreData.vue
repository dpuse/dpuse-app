<script setup lang="ts">
// External Dependencies & Registrations
import { ref } from 'vue';

// Local Components - Static
import InvestigateData from './investigateData/InvestigateData.vue';
import TransformData from './transformData/TransformData.vue';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeOptionId = ref<'transform' | 'investigate'>('investigate');
</script>

<template>
    <!-- Transform Panel -->
    <TransformData v-if="activeOptionId === 'transform'" />

    <!-- Investigate Panel -->
    <InvestigateData v-if="activeOptionId === 'investigate'" />

    <!-- Option Selector -->
    <div class="fixed right-(--safe-right-offset) bottom-(--safe-bottom-offset)">
        <span class="isolate inline-flex h-10 rounded-full shadow-md">
            <!-- View mode buttons -->
            <button
                type="button"
                class="relative inline-flex items-center rounded-l-full py-2 pr-2 pl-3 text-xs text-gray-900 inset-ring-1 inset-ring-gray-300 focus:z-10"
                :class="
                    activeOptionId === 'transform'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
                        : 'bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                "
                :aria-pressed="activeOptionId === 'transform'"
                @click="activeOptionId = 'transform'"
            >
                Transform
            </button>

            <button
                type="button"
                class="relative -ml-px inline-flex items-center rounded-r-full p-2 text-xs text-gray-900 inset-ring-1 inset-ring-gray-300 focus:z-10"
                :class="
                    activeOptionId === 'investigate'
                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600'
                        : 'bg-white hover:bg-gray-50 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                "
                :aria-pressed="activeOptionId === 'investigate'"
                @click="activeOptionId = 'investigate'"
            >
                Investigate
            </button>
        </span>
    </div>
</template>
