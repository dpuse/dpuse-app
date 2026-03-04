<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workflow/assembleDimensions/AssembleDimensions.json';

// App Components
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';

// Properties
const { displayIsWide } = defineProps<{ displayIsWide: boolean }>();
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'Workflow_Benchtop') }]" :title="t(T, 'Assemble_Dimensions')" :display-is-wide="displayIsWide" />

        <RouterView />
    </BenchtopShell>
</template>
