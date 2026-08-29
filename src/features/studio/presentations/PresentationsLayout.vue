<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, nextTick, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { appearanceIsDark } from '@/state/appLayout';
import type { ComponentReferenceConfig } from '@dpuse/dpuse-shared/component';
import type { DataSource } from '@/composables/useDataWindow';
import type { PresenterInterface } from '@dpuse/dpuse-shared/component/module/presenter';
import { reportAppError } from '@/observability/errorTracking';
import { t } from '@/state/locale';
import { useConfigsReady } from '@/services/useConfigsReady';
import { type LocalisedReference, localiseReference } from '@dpuse/dpuse-shared/locale';
import { presenterConfigs, toolConfigs } from '@/state/session';

// ── Static Components
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorDisplay from '@/components/ui/error/ErrorDisplay.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Explore_Presentations: { en: 'Explore Presentations', es: 'Explorar Presentaciones' },
    'wb.label': { en: 'Workflow', es: 'Flujo de Trabajo' }
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activePresentationReference = shallowRef<LocalisedReference<ComponentReferenceConfig>>();
const container = useTemplateRef<HTMLDivElement>('container');
const presentationReferences = shallowRef<LocalisedReference<ComponentReferenceConfig>[]>();
const presenters: PresenterInterface[] = [];
// Keyed by reference object, so entries for references dropped on a retry become unreachable and need no explicit clear.
const presenterByPresentationReference = new WeakMap<LocalisedReference<ComponentReferenceConfig>, PresenterInterface>();

// A presenter that fails to load only costs its own presentations, so the list still shows whatever else loaded and the
// failure is surfaced as a notice above it rather than replacing the page.
const loadError = shallowRef<AppError | undefined>();
// Undefined until the error report completes, so the notice can distinguish reporting-pending from failed.
const loadErrorWasReported = ref<boolean | undefined>();

// A render failure is confined to the detail pane, so it is held separately and presented there.
const renderError = shallowRef<AppError | undefined>();
const renderErrorWasReported = ref<boolean | undefined>();

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

function handleRetryLoad(): void {
    void loadPresenters();
}

function handleRetryRender(): void {
    void handleSelectPresentation(activePresentationReference.value);
}

async function handleSelectPresentation(presentationReference: LocalisedReference<ComponentReferenceConfig> | undefined): Promise<void> {
    renderError.value = undefined;
    renderErrorWasReported.value = undefined;
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
        renderError.value = new AppError('Failed to render presentation.', 'dpuse.presentationsLayout.handleSelectPresentation', data, { cause: error });
        renderErrorWasReported.value = await reportAppError(renderError.value);
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Each presenter is loaded independently so that one unavailable module costs only its own presentations.
async function loadPresenters(): Promise<void> {
    loadError.value = undefined;
    loadErrorWasReported.value = undefined;
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
    loadError.value = new AppError(
        `Failed to load ${String(failedPresenterIds.length)} of ${String(presenterConfigs.value.length)} presenters.`,
        'dpuse.presentationsLayout.loadPresenters',
        data
    );
    loadErrorWasReported.value = await reportAppError(loadError.value);
}
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-4" overline="Studio" :title="t(T, 'Explore_Presentations')" to="studio" />

        <Separator />

        <ErrorDisplay v-if="loadError" class="mx-4 mt-2" :error="loadError" :error-was-reported="loadErrorWasReported" @retry="handleRetryLoad" />

        <GridDetailPanel
            :active-item="activePresentationReference"
            class="min-h-0 flex-1"
            :data-source="presentationReferencesDataSource"
            :is-compact="true"
            max-list-width="350px"
            @select="handleSelectPresentation($event)"
        >
            <template #grid-item="{ item }">
                <ConfigCard v-if="item" :config="item" :is-compact="true" />
            </template>

            <template #detail>
                <ErrorDisplay v-if="renderError" :error="renderError" :error-was-reported="renderErrorWasReported" @retry="handleRetryRender" />
                <div v-show="!renderError" ref="container" class="dpuse-prose overflow-y-scroll overscroll-y-none px-4 pt-4" />
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
