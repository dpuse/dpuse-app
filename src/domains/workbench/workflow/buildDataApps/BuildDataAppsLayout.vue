<script setup lang="ts">
// Local Framework
import { t } from '@/translations';
import T from '@/translations/domains/workbench/workflow/buildDataApps/BuildDataAppsLayout.json';

// Local Components - Static
import Header from '@/components/layout/header/Header.vue';
import LayoutShell from '@/components/layout/layoutShell/LayoutShell.vue';

//

import '@svar-ui/vue-grid/style.css';
import { Grid, Willow } from '@svar-ui/vue-grid';

const data = [
    { id: 1, name: 'Alice', role: 'Developer', status: 'Active' },
    { id: 2, name: 'Bob', role: 'Designer', status: 'Away' }
];

const columns = [
    { id: 'name', header: 'Name', width: 150 },
    { id: 'role', header: 'Role', width: 120 },
    { id: 'status', header: 'Status', width: 100 }
];
</script>

<template>
    <LayoutShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Build_Data_Apps')" />

        <!-- <RouterView /> -->

        <Willow>
            <Grid :data="data" :columns="columns" />
        </Willow>
    </LayoutShell>
</template>
