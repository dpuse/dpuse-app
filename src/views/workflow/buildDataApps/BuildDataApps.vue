<script setup lang="ts">
// Components
import BenchtopScroller from '@/components/block/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/block/benchtop/BenchtopShell.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
const properties = defineProps<{ isDisplayWide: boolean }>();
</script>

<template>
    <BenchtopShell>
        <Header title="Build Data Apps" :is-display-wide="properties.isDisplayWide" />

        <BenchtopScroller></BenchtopScroller>
    </BenchtopShell>
</template>
