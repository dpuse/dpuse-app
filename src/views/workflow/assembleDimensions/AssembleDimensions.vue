<script setup lang="ts">
// Vendor dependencies
import { onMounted } from 'vue';

// Workbench components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
const properties = defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isDisplayWide: boolean }>();

// Initialise authentication and monitor services
onMounted(() => {
    throw new Error('Just testing...');
});
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-display-wide="properties.isDisplayWide">
        <Header title="Assemble Dimensions" :is-display-wide="properties.isDisplayWide" />

        <BenchtopScroller></BenchtopScroller>
    </BenchtopShell>
</template>
