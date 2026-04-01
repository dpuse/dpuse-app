<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';

// App Core
import { t } from '@/locales';
import T from '@/locales/views/workbench/workflow/buildDataApps/BuildDataApps.json';

// App Components & Views - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';
import ListScroller from '@/components/listScroller/ListScroller.vue';
import ViewShell from '@/components/view/ViewShell.vue';

// Demo data — 1000 records loaded upfront.
const rows = ref(Array.from({ length: 1000 }, (_, index) => ({ id: index, label: `Row ${index + 1}` })));
</script>

<template>
    <ViewShell>
        <Header :breadcrumbs="[{ id: 'benchtop', label: t(T, 'wb.label') }]" :title="t(T, 'Build_Data_Apps')" :workbench-pane-is-hidden="false" />

        <ListScroller :count="rows.length" :estimate-size="() => 48">
            <template #default="{ index }">
                <div class="border-separator flex h-12 items-center border-b px-4 text-sm">
                    <span class="text-secondary w-16 font-mono">{{ rows[index].id + 1 }}</span>
                    <span>{{ rows[index].label }}</span>
                </div>
            </template>
        </ListScroller>
    </ViewShell>
</template>
