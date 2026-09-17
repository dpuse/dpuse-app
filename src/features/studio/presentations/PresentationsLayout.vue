<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { computed, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import type { ComponentReferenceConfig } from '@dpuse/dpuse-shared/component';
import type { PresenterInterface } from '@dpuse/dpuse-shared/component/module/presenter';
import { type LocalisedReference, localiseReference } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { appearanceIsDark } from '@/state/appLayout';
import type { DataSource } from '@/composables/useDataWindow';
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/state/locale';
import { useConfigsReady } from '@/services/useConfigsReady';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { presenterConfigs, toolConfigs } from '@/state/session';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'explorePresentations.title': { en: 'Explore Presentations', es: 'Explorar Presentaciones' },
    'workflow.label': { en: 'Workflow', es: 'Flujo de Trabajo' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activePresentationReference = shallowRef<LocalisedReference<ComponentReferenceConfig>>();
const container = useTemplateRef<HTMLDivElement>('container');
const presentationReferences = shallowRef<LocalisedReference<ComponentReferenceConfig>[]>();
const presenters: PresenterInterface[] = [];
// Keyed by reference object, so entries for references dropped on a retry become unreachable and need no explicit clear.
const presenterByPresentationReference = new WeakMap<LocalisedReference<ComponentReferenceConfig>, PresenterInterface>();

// A render failure is confined to the detail pane, so it is held separately and presented there.
const renderFailure = shallowRef<AppFailure | undefined>();

const route = useRoute();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const presentationReferencesDataSource = computed((): DataSource<LocalisedReference<ComponentReferenceConfig>> => ({
    rowCount: presentationReferences.value?.length,
    getRows: (start: number, end: number): Promise<{ rows: LocalisedReference<ComponentReferenceConfig>[] }> =>
        Promise.resolve({ rows: (presentationReferences.value ?? []).slice(start, end) })
}));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(appearanceIsDark, (isDark) => {
    for (const presenter of presenters) presenter.setColorMode(isDark ? 'dark' : 'light');
});

onMounted(() => {
    void loadPresenters();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetryRender(): void {
    void handleSelectPresentation(activePresentationReference.value);
}

async function handleSelectPresentation(presentationReference: LocalisedReference<ComponentReferenceConfig> | undefined): Promise<void> {
    renderFailure.value = undefined;
    activePresentationReference.value = presentationReference;
    if (!activePresentationReference.value) return;
    const presenter = presenterByPresentationReference.get(activePresentationReference.value);
    if (!presenter) return;

    await nextTick();
    if (!container.value) return; // Selection changed again before the detail pane rendered.

    try {
        await presenter.render(activePresentationReference.value, container.value);
    } catch (error) {
        const data = { presentationReferenceId: activePresentationReference.value.id };
        renderFailure.value = raiseFailure(new AppError('Failed to render presentation.', 'dpuse.presentationsLayout.handleSelectPresentation', data, { cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Each presenter is loaded independently so that one unavailable module costs only its own presentations.
async function loadPresenters(): Promise<void> {
    presenters.length = 0;
    presentationReferences.value = undefined;

    await useConfigsReady();

    const failedPresenterIds: string[] = [];
    for (const presenterConfig of presenterConfigs.value) {
        try {
            const presenterId = presenterConfig.id.split('-').pop();
            if (presenterId == null) throw new Error(`Presenter id could not be derived from '${presenterConfig.id}'.`);

            const url = `https://engine-eu.dpuse.app/presenters/${presenterId}_v${presenterConfig.version}/${presenterConfig.id}.es.js`;
            const module = (await import(/* @vite-ignore */ url)) as { default: new (toolConfigs: unknown, colorMode: string) => PresenterInterface };
            const presenter = new module.default(toolConfigs.value, appearanceIsDark.value ? 'dark' : 'light');
            presenters.push(presenter);

            const newPresentationReferences = presenter.list().map((presentationReference) => localiseReference(presentationReference, 'en')); // TODO: Could also use 'presenterConfig.presentations', though it is a map, not an array.
            for (const presentationReference of newPresentationReferences) presenterByPresentationReference.set(presentationReference, presenter);
            presentationReferences.value = [...(presentationReferences.value ?? []), ...newPresentationReferences];
        } catch (error) {
            failedPresenterIds.push(presenterConfig.id);
            const data = { presenterConfigId: presenterConfig.id };
            void reportAppError(new AppError('Failed to load presenter.', 'dpuse.presentationsLayout.loadPresenters', data, { cause: error }));
        }
    }

    // An undefined count reads as 'not yet known' and leaves the grid busy indefinitely, so confirm an empty result.
    presentationReferences.value ??= [];

    if (failedPresenterIds.length === 0) return;

    // Individual failures are reported above; this one drives the notice, so it names the presenters rather than a cause.
    const data = { failedPresenterIds };
    // Announced rather than shown above the list: the presenters that did load are in it, so this has taken no space
    // here. Covering the list to report two failures would hide the three that work.
    raiseAppFailure(
        new AppError(
            `Failed to load ${String(failedPresenterIds.length)} of ${String(presenterConfigs.value.length)} presenters.`,
            'dpuse.presentationsLayout.loadPresenters',
            data
        ),
        { retry: () => void loadPresenters() }
    );
}
</script>

<template>
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-4" overline="Studio" :title="t(TEXT, 'explorePresentations.title')" :to="{ name: 'studio', query: route.query }" />

        <!-- Body -->
        <Separator />
        <GridDetailPanel
            :active-item="activePresentationReference"
            class="min-h-0 flex-1"
            :data-source="presentationReferencesDataSource"
            :is-compact="true"
            max-grid-width="350px"
        >
            <template #item="{ item }">
                <ConfigCard v-if="item" :config="item" :is-compact="true" @click="handleSelectPresentation(item)" />
            </template>

            <template #detail>
                <ErrorNotice v-if="renderFailure" covers-region :failures="[renderFailure]" @retry="handleRetryRender" />
                <div v-show="!renderFailure" ref="container" class="dpuse-prose overflow-y-scroll overscroll-y-none px-4 pt-4" />
            </template>

            <template #no-selection>
                <SelectPlaceholder :message="'Select a presentation from the list.'" />
            </template>
        </GridDetailPanel>
    </StudioLayout>
</template>

<style scoped>
:deep(math) * {
    font-size: inherit; /* Stop maths fractions using a smaller font. */
}
</style>
