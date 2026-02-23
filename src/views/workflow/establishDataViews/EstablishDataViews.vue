<script setup lang="ts">
// App core
import { t } from '@/locales';
import T from '@/locales/views/workflow/establishDataViews/EstablishDataViews.json';

// App components
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';

// Properties
defineProps<{ isWideDisplay: boolean }>();
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'Workflow_Benchtop') }]" :title="t(T, 'Establish_Data_Views')" :is-wide-display="isWideDisplay" />

        <RouterView />
    </BenchtopShell>
</template>
