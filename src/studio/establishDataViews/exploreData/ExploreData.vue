<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Components - Static
import InvestigateData from './investigateData/InvestigateData.vue';
import TransformData from './transformData/TransformData.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────
// Declared (even though this is the last wizard step and never actually emits) so Vue treats these as real
// props/an real emit instead of fallthrough attrs/listeners — see the template's root-element note below for why
// that distinction matters here specifically.

defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeOptionId = ref<'transform' | 'investigate'>('investigate');
</script>

<template>
    <!-- Single root element required: EstablishDataViewsLayout passes class="min-h-0 flex-1" plus the props/emit
         above via fallthrough, and Vue can only auto-apply fallthrough attrs when a component has exactly one
         root node — a fragment root (this used to have three: TransformData, InvestigateData, the option selector)
         silently drops them instead, which was also leaving this panel without its flex sizing. -->
    <div class="relative flex flex-col">
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
    </div>
</template>
