<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue';

// ── Local Framework
import { appearanceIsDark } from '@/state/appLayout';
import type { ComponentReference } from '@dpuse/dpuse-shared/component';
import type { ContextConfig } from '@dpuse/dpuse-shared/component/module/context';
import type { DataSource } from '@/composables/useDataWindow';
import type { PresenterInterface } from '@dpuse/dpuse-shared/component/module/presenter';
import { type LocalisedConfig, type LocalisedReference, localiseReference } from '@dpuse/dpuse-shared/locale';
import { presenterConfigs, toolConfigs } from '@/state/session';

// ── Local Components - Static
import Card from '@/components/ui/Card.vue';
import GridDetailPanel from '@/components/framework/gridDetailPanel/GridDetailPanel.vue';
import SelectPlaceholder from '@/components/ui/placeholders/SelectPlaceholder.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface FocusConfig {
    id: string;
    label: Record<string, string>;
    description: Record<string, string>[];
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeContextConfig = shallowRef<LocalisedConfig<ContextConfig> | undefined>();
const contextLocalisedConfigs = shallowRef<LocalisedConfig<ContextConfig>>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const contextFocusConfigsDataSource = computed<DataSource<LocalisedConfig<FocusConfig>>>(() => ({
    rowCount: contextLocalisedConfigs.value?.focuses.length ?? 0,
    getRows: (start, end): Promise<{ rows: LocalisedConfig<FocusConfig>[] }> => Promise.resolve({ rows: contextLocalisedConfigs.value?.models.slice(start, end) })
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
watch(appearanceIsDark, (isDark) => presenter.value?.setColorMode(isDark ? 'dark' : 'light'));

onMounted(async () => {
    await Promise.all([toolReady, presenterReady]);

    const defaultPresenter = presenterConfigs.value[0];
    const url = `https://engine-eu.dpuse.app/presenters/default_v${defaultPresenter.version}/dpuse-presenter-default.es.js`;
    const module = await import(/* @vite-ignore */ url);
    const presenterModule = module.default;
    presenter.value = new presenterModule(toolConfigs.value, appearanceIsDark.value ? 'dark' : 'light') as PresenterInterface;

    presentationReferences.value = presenter.value.list().map((presentationReference) => localiseReference(presentationReference, 'en')); // TODO: Could also use 'defaultPresenter.presentations', though it is a map, not an array.
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSelectPresentation(presentationReference: LocalisedReference<ComponentReference> | undefined): Promise<void> {
    activePresentationReference.value = presentationReference;
    if (!activePresentationReference.value) return;
    await nextTick();
    presenter.value!.render(activePresentationReference.value, container.value!);
}
</script>

<template>
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
            <div ref="container" class="dpuse-text overflow-y-scroll overscroll-y-none px-4 pt-4" />
        </template>

        <template #no-selection>
            <SelectPlaceholder :message="'Select a focus from the list.'" />
        </template>
    </GridDetailPanel>
</template>
