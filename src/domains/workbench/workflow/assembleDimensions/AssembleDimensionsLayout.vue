<script setup lang="ts">
// Local (App) Framework
import { t } from '@/state/locale';
import T from './AssembleDimensionsLayout.json';

// Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../../WorkbenchLayout.vue';
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="mx-4" :overline="t(T, 'wb.label')" :title="t(T, 'Assemble_Dimensions')" to="workflow" />

        <Separator class="mx-4" />
        <RouterView />
    </WorkbenchLayout>
</template>
