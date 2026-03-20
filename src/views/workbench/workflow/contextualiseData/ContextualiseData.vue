<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workflow/contextualiseData/ContextualiseData.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';
</script>

<template>
    <BenchtopShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Contextualise_Data')" :workbench-pane-is-hidden="false" />

        <RouterView />
    </BenchtopShell>
</template>
