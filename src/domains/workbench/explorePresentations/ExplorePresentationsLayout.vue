<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted } from 'vue';

// ── Local (App) Framework
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';
import { toolConfigs } from '@/state/session';

// ── Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(async () => {
    const url = 'https://engine-eu.dpuse.app/presenters/default_v0.1.1028/dpuse-presenter-default.es.js';
    const module = await import(/* @vite-ignore */ url);
    const presenterModule = module.default;
    const presenter = new presenterModule(toolConfigs.value);
    presenter.render('hr/wrkFor/physicalHeadcount', document.querySelector('#container'));
});
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workbench" />

        <!-- <div class="relative flex min-h-0 flex-1 flex-col">
            <Separator class="mx-4" />
            <RouterView />
        </div> -->

        <div id="container" class="h-96 w-full overflow-y-scroll" />
    </WorkbenchLayout>
</template>
