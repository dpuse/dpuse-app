<script setup lang="ts">
// DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local Components - Static
import type { StepConfig } from '@/components/ui/steps/Steps.vue';

// Options, Properties, Slots & Emits
const { stepLocalisedConfig } = defineProps<{ stepLocalisedConfig: LocalisedConfig<StepConfig> }>();
defineEmits<{ 'step-completed': [stepLocalisedConfig: LocalisedConfig<StepConfig>] }>();
</script>

<template>
    <div class="px-4 pt-1">
        <div>Audit content...</div>

        <RouterLink :to="{ name: 'exploreData', query: { ...$route.query, wbView: 'exploreData' } }" @click="$emit('step-completed', stepLocalisedConfig)">Next...</RouterLink>
    </div>
</template>
