<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { CircleCheckIcon, CircleDashedIcon } from '@lucide/vue';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import T from './DataViewSummaryPanel.json';
import { t } from '@/state/locale';

// ── Local Components - Static
import CloseButton from '@/components/ui/button/CloseButton.vue';
import ScrollArea from '@/components/ui/ScrollArea2.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { dataViewLocalisedConfig } = defineProps<{ dataViewLocalisedConfig: LocalisedConfig<DataViewConfig> }>();
const emit = defineEmits<{ clear: []; submit: [] }>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Mirrors the step gating in DataViewList's routing logic — the first unmet step is where "Continue" resumes.
const progressSteps = computed(() => [
    { id: 'connection', label: t(T, 'Connection'), isComplete: dataViewLocalisedConfig.connectionId != null },
    { id: 'item', label: t(T, 'Item'), isComplete: dataViewLocalisedConfig.connectionNodeConfig != null },
    { id: 'content', label: t(T, 'Content'), isComplete: dataViewLocalisedConfig.contentAuditConfig != null },
    { id: 'data', label: t(T, 'Data'), isComplete: false }
]);
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col pl-4" data-region="DataViewSummaryPanel">
        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="dpuse-prose relative pt-4">
                <!-- Header -->
                <div class="flex items-center gap-x-4">
                    <div class="flex-1">
                        <h1>{{ dataViewLocalisedConfig.label }}</h1>
                    </div>

                    <!-- <div v-if="dataViewLocalisedConfig.icon != null" class="mr-2 flex-none">
                    <div aria-hidden="true" class="flex h-12 items-center dark:hidden [&>svg]:h-full [&>svg]:w-auto" v-html="dataViewLocalisedConfig.icon" />
                    <div
                        aria-hidden="true"
                        class="hidden h-12 items-center dark:flex [&>svg]:h-full [&>svg]:w-auto"
                        v-html="dataViewLocalisedConfig.iconDark ?? dataViewLocalisedConfig.icon ?? ''"
                    />
                </div> -->
                </div>

                <CloseButton class="absolute top-2 right-0 hidden md:block" @click="$emit('clear')" />

                <!-- Description -->
                <!-- <p v-if="dataViewLocalisedConfig.description">{{ dataViewLocalisedConfig.description }}</p> -->
                <p v-if="dataViewLocalisedConfig.description">Retrieves the records from the XXX table via the YYY connector.</p>

                <!-- Setup Progress -->
                <h2>{{ t(T, 'Setup_progress') }}</h2>
                <ul>
                    <li v-for="step in progressSteps" :key="step.id" class="flex items-center gap-x-2">
                        <CircleCheckIcon v-if="step.isComplete" class="size-4 flex-none text-green-600 dark:text-green-500" :stroke-width="1.5" />
                        <CircleDashedIcon v-else class="size-4 flex-none text-muted" :stroke-width="1.5" />
                        {{ step.label }}
                    </li>
                </ul>
            </div>
        </ScrollArea>
    </div>
</template>

<style scoped>
ul {
    list-style: none;
    padding-left: 0;
}
</style>
