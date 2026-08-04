<script setup lang="ts">
// External
import ApexCharts from 'apexcharts/line';
import { onMounted, useTemplateRef } from 'vue';

// Local Framework
import { t } from '@/state/locale';
import T from './AssembleDimensionsLayout.json';

// Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// Temporary: apexcharts bundle-size evaluation.
const chartElement = useTemplateRef('chartElement');

onMounted(() => {
    if (!chartElement.value) return;

    const chart = new ApexCharts(chartElement.value, {
        chart: { type: 'line', height: 240 },
        series: [{ name: 'Sample', data: [30, 40, 35, 50, 49, 60, 70] }],
        xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    });
    chart.render();
});
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Assemble_Dimensions')" to="workbench" />

        <div class="relative flex min-h-0 flex-1 flex-col">
            <Separator class="mx-4" />
            <div ref="chartElement" class="mx-4 mt-4" />
            <RouterView />
        </div>
    </WorkbenchLayout>
</template>
