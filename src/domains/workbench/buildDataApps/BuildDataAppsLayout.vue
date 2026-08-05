<script setup lang="ts">
// Local Framework
import { t } from '@/state/locale';
import T from './BuildDataAppsLayout.json';

// Local Components - Static
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Build_Data_Apps')" to="workbench" />

        <Separator class="mx-4" />

        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <RouterView />
            </div>
        </ScrollArea>
    </WorkbenchLayout>
</template>
