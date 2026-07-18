<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, onMounted, shallowRef, watch } from 'vue';

// ── Local (App) Framework
import type { ComponentReference } from '@dpuse/dpuse-shared/component';
import type { DataSource } from '@/composables/useDataWindow';
import type { PresenterInterface } from '@dpuse/dpuse-shared/component/module/presenter';
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';
import { type LocalisedReference, localiseReference } from '@dpuse/dpuse-shared/locale';
import { presenterConfigs, toolConfigs } from '@/state/session';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activePresentationReference = shallowRef<LocalisedReference<ComponentReference>>();
const presentationReferences = shallowRef<LocalisedReference<ComponentReference>[]>();
const presenter = shallowRef<PresenterInterface>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const presentationReferencesDataSource = computed((): DataSource<LocalisedReference<ComponentReference>> => ({
    rowCount: presentationReferences.value?.length ?? 0,
    getRows: (start: number, end: number): Promise<{ rows: LocalisedReference<ComponentReference>[] }> =>
        Promise.resolve({ rows: (presentationReferences.value ?? []).slice(start, end) })
}));

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

    console.log(presenterConfigs.value);
    const defaultPresenter = presenterConfigs.value[0];
    const url = `https://engine-eu.dpuse.app/presenters/default_v${defaultPresenter.version}/dpuse-presenter-default.es.js`;
    const module = await import(/* @vite-ignore */ url);
    const presenterModule = module.default;
    presenter.value = new presenterModule(toolConfigs.value) as PresenterInterface;

    // presentationReferences.value = presenter.value.list(); // TODO: Could also use 'defaultPresenter.presentations', though it is a map, not an array.
    presentationReferences.value = presenter.value.list().map((presentationReference) => localiseReference(presentationReference, 'en'));
    console.log('ppp', presentationReferences.value);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectPresentation(presentationReference: LocalisedReference<ComponentReference> | undefined): void {
    activePresentationReference.value = presentationReference;
    presenter.value!.render('hr/wrkFor/physicalHeadcount', document.querySelector('#container')!);
}
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workbench" />

        <Separator class="mx-4" />

        <!-- <div class="flex min-h-0 flex-1 px-4">
            <div class="flex flex-none flex-col overflow-y-scroll overscroll-y-none">
                <div v-for="presentationReference in presentationReferences" :key="presentationReference.id">{{ presentationReference.label.en }}</div>
            </div>

            <div class="flex-1 overflow-y-scroll overscroll-y-none">
                <div id="container" class="overflow-y-scroll" />
            </div>
        </div> -->

        <GridDetailPanel
            :active-item="activePresentationReference"
            :data-source="presentationReferencesDataSource"
            :is-compact="true"
            max-list-width="400px"
            @select="handleSelectPresentation($event)"
        >
            <template #header> </template>

            <template #grid-item="{ item }">
                <Card v-if="item" :icon="item.icon ?? undefined" :is-compact="true" :label="item.label" />
            </template>

            <template #detail>
                <div id="container" class="overflow-y-scroll" />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="'Select a presentation from the list.'" />
            </template>
        </GridDetailPanel>
    </WorkbenchLayout>
</template>
