<script setup lang="ts">
// Local (App) Framework
import { t } from '@/state/locale';
import T from './ManageContextsLayout.json';

// Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../../WorkbenchLayout.vue';
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Build_Data_Apps')" to="workflow" />

        <div class="relative flex min-h-0 flex-1 flex-col">
            <Separator class="mx-4" />
            <RouterView />
        </div>
    </WorkbenchLayout>
</template>
