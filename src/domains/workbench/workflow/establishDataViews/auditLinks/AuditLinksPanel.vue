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
        <div>Audit links will be implemented in a future release...</div>
    </div>
</template>
