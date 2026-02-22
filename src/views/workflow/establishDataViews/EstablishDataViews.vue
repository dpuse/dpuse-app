<script setup lang="ts">
// App core
import { t } from '@/locales';
import T from '@/locales/views/workflow/establishDataViews/EstablishDataViews.json';

// App components
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';

// Properties
type Properties = { isWideDisplay: boolean };
const { isWideDisplay } = defineProps<Properties>();
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'overline') }]" :title="t(T, 'title')" :is-wide-display="isWideDisplay" />

        <RouterView />
    </BenchtopShell>
</template>
