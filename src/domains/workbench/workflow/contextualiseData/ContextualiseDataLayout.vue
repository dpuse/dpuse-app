<script setup lang="ts">
// Local Framework
import { t } from '@/state/locale';
import T from './ContextualiseDataLayout.json';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';
</script>

<template>
    <LayoutShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Contextualise_Data')" />

        <RouterView />
    </LayoutShell>
</template>
