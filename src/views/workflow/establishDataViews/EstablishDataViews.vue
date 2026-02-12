<script setup lang="ts">
// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
const properties = defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isWideDisplay: boolean }>();
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-wide-display="properties.isWideDisplay">
        <Header
            :breadcrumbs="[{ id: 'workflow', label: 'Workflow Benchtop' }]"
            title="Establish Data Views"
            :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay"
            :is-wide-display="properties.isWideDisplay"
        />

        <BenchtopScroller class="flex-1"></BenchtopScroller>
    </BenchtopShell>
</template>
