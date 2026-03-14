<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workflow/assembleDimensions/AssembleDimensions.json';

// App Components - Statically imported so always available, even when offline.
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'Workflow_Benchtop') }]" :title="t(T, 'Assemble_Dimensions')" :workbench-pane-is-hidden="false" />

        <RouterView />
    </BenchtopShell>
</template>
