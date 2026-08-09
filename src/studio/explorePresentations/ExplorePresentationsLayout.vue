<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue';

// ── Local Framework
import { appearanceIsDark } from '@/state/appLayout';
import type { ComponentReferenceConfig } from '@dpuse/dpuse-shared/component';
import type { DataSource } from '@/composables/useDataWindow';
import type { PresenterInterface } from '@dpuse/dpuse-shared/component/module/presenter';
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';
import { type LocalisedReference, localiseReference } from '@dpuse/dpuse-shared/locale';
import { presenterConfigs, toolConfigs } from '@/state/session';

// ── Local Components - Static
import ComponentCard from '@/components/framework/ComponentCard.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/components/framework/header/StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activePresentationReference = shallowRef<LocalisedReference<ComponentReferenceConfig>>();
const container = useTemplateRef<HTMLDivElement>('container');
const presentationReferences = shallowRef<LocalisedReference<ComponentReferenceConfig>[]>();
const presenters: PresenterInterface[] = [];
const presenterByPresentationReference = new WeakMap<LocalisedReference<ComponentReferenceConfig>, PresenterInterface>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const presentationReferencesDataSource = computed((): DataSource<LocalisedReference<ComponentReferenceConfig>> => ({
    rowCount: presentationReferences.value?.length ?? 0,
    getRows: (start: number, end: number): Promise<{ rows: LocalisedReference<ComponentReferenceConfig>[] }> =>
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
watch(appearanceIsDark, (isDark) => {
    for (const presenter of presenters) presenter.setColorMode(isDark ? 'dark' : 'light');
});

onMounted(async () => {
    await Promise.all([toolReady, presenterReady]);

    for (const presenterConfig of presenterConfigs.value) {
        const presenterId = presenterConfig.id.split('-').pop();

        const url = `https://engine-eu.dpuse.app/presenters/${presenterId}_v${presenterConfig.version}/${presenterConfig.id}.es.js`;
        const module = await import(/* @vite-ignore */ url);
        const presenterModule = module.default;
        const presenter = new presenterModule(toolConfigs.value, appearanceIsDark.value ? 'dark' : 'light') as PresenterInterface;
        presenters.push(presenter);

        const newPresentationReferences = presenter.list().map((presentationReference) => localiseReference(presentationReference, 'en')); // TODO: Could also use 'presenterConfig.presentations', though it is a map, not an array.
        for (const presentationReference of newPresentationReferences) presenterByPresentationReference.set(presentationReference, presenter);

        presentationReferences.value = [...(presentationReferences.value ?? []), ...newPresentationReferences];
    }
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSelectPresentation(presentationReference: LocalisedReference<ComponentReferenceConfig> | undefined): Promise<void> {
    activePresentationReference.value = presentationReference;
    if (!activePresentationReference.value) return;
    const presenter = presenterByPresentationReference.get(activePresentationReference.value);
    if (!presenter) return;
    await nextTick();
    presenter.render(activePresentationReference.value, container.value!);
}
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-4" :title="t(T, 'Explore_Presentations')" to="studio" />

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
                <ComponentCard v-if="item" :icon="item.icon ?? undefined" :is-compact="true" :label="item.label" />
            </template>

            <template #detail>
                <div ref="container" class="dpuse-prose overflow-y-scroll overscroll-y-none px-4 pt-4" />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="'Select a presentation from the list.'" />
            </template>
        </GridDetailPanel>
    </StudioLayout>
</template>

<style scoped>
:deep(math) * {
    font-size: inherit; /* Otherwise fractions use a smaller font. */
}
</style>
