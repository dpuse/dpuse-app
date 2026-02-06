<script setup lang="ts">
// Components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
const properties = defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isDisplayWide: boolean }>();
</script>

<template>
    <BenchtopShell :is-assist-panel-open-in-wide-display="isAssistPanelOpenInWideDisplay" :is-display-wide="properties.isDisplayWide">
        <Header title="Build Data Apps" :is-display-wide="properties.isDisplayWide" />

        <BenchtopScroller></BenchtopScroller>
    </BenchtopShell>
</template>
