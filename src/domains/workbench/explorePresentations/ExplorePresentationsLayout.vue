<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue';

// ── Local Framework
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
const container = useTemplateRef<HTMLDivElement>('container');
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

    const defaultPresenter = presenterConfigs.value[0];
    const url = `https://engine-eu.dpuse.app/presenters/default_v${defaultPresenter.version}/dpuse-presenter-default.es.js`;
    const module = await import(/* @vite-ignore */ url);
    const presenterModule = module.default;
    presenter.value = new presenterModule(toolConfigs.value) as PresenterInterface;

    presentationReferences.value = presenter.value.list().map((presentationReference) => localiseReference(presentationReference, 'en')); // TODO: Could also use 'defaultPresenter.presentations', though it is a map, not an array.
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSelectPresentation(presentationReference: LocalisedReference<ComponentReference> | undefined): Promise<void> {
    activePresentationReference.value = presentationReference;
    await nextTick();
    presenter.value!.render(activePresentationReference.value!.path, container.value!);
}
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workbench" />

        <Separator class="mx-4" />

        <GridDetailPanel
            :active-item="activePresentationReference"
            class="min-h-0 flex-1"
            :data-source="presentationReferencesDataSource"
            :is-compact="true"
            max-list-width="350px"
            @select="handleSelectPresentation($event)"
        >
            <template #grid-item="{ item }">
                <Card v-if="item" :icon="item.icon ?? undefined" :is-compact="true" :label="item.label" />
            </template>

            <template #detail>
                <div ref="container" class="overflow-y-scroll overscroll-y-none px-4" />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="'Select a presentation from the list.'" />
            </template>
        </GridDetailPanel>
    </WorkbenchLayout>
</template>
