<script setup lang="ts">
// App core
import { t } from '@/locales';
import T from '@/locales/views/workflow/assembleDimensions/AssembleDimensions.json';

// App components
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';

// Properties
type Properties = { isWideDisplay: boolean };
defineProps<Properties>();
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'Workflow_Benchtop') }]" :title="t(T, 'Assemble_Dimensions')" :is-wide-display="isWideDisplay" />

        <RouterView />
    </BenchtopShell>
</template>
