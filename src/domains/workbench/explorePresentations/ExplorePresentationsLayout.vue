<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, shallowRef, watch } from 'vue';

// ── Local (App) Framework
import type { PresentationConfig } from '@dpuse/dpuse-shared/component/presentation';
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';
import { presenterConfigs, toolConfigs } from '@/state/session';

// ── Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const presentationConfigs = shallowRef<PresentationConfig[]>();

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

const toolReady = new Promise<void>((resolve) => {
    watch(
        toolConfigs,
        (newToolConfigs) => {
            if (newToolConfigs.length === 0) return;
            resolve();
        },
        { immediate: true }
    );
});
const presenterReady = new Promise<void>((resolve) => {
    watch(
        presenterConfigs,
        (newPresenterConfigs) => {
            if (newPresenterConfigs.length === 0) return;
            resolve();
        },
        { immediate: true }
    );
});

onMounted(async () => {
    await Promise.all([toolReady, presenterReady]);

    const url = 'https://engine-eu.dpuse.app/presenters/default_v0.1.1031/dpuse-presenter-default.es.js';
    const module = await import(/* @vite-ignore */ url);
    const presenterModule = module.default;
    const presenter = new presenterModule(toolConfigs.value);
    presenter.render('hr/wrkFor/physicalHeadcount', document.querySelector('#container'));

    presentationConfigs.value = presenter.list();
});
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workbench" />

        <Separator class="mx-4" />

        <!-- <div class="relative flex min-h-0 flex-1 flex-col">
            <RouterView />
        </div> -->

        <div class="mx-4 flex min-h-0 flex-1 overflow-y-scroll overscroll-y-none">
            <div class="flex flex-none flex-col">
                <div v-for="presentationConfig in presentationConfigs" :key="presentationConfig.id">{{ presentationConfig.label.en }}</div>
            </div>

            <div class="flex-1">
                <div id="container" class="overflow-y-scroll" />
            </div>
        </div>
    </WorkbenchLayout>
</template>
