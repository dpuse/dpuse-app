<script setup lang="ts">
// The detail of the part of the context the diagram is drilled down to: an area, a model, an entity or an event. It is
// read-only, because the context is changed in Setup. It names the part, says where it sits, and lists what it holds,
// down to the event queries saved for an event.

// ── External Dependencies & Registrations
import { computed, shallowRef } from 'vue';

// ── DPUse Framework
import type { ContextModelConfig, EventQueryConfig, LocalisedConfig } from '@dpuse/dpuse-shared';
import { localiseConfig, localiseReference } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localiseText } from '@/state/contextModels';
import { TEXT } from './ContextPartDetail_.json';
import type { ContextAreaConfig, ContextEntityConfig, ContextEventConfig, ContextModelReferenceConfig } from './_contextDiagramFocus';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import ScrollEndButtons from '@/components/ui/scroll/ScrollEndButtons.vue';
import StudioDetailLayout from '@/features/studio/_components/StudioDetailLayout.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type ContextPartTypeId = 'area' | 'entity' | 'event' | 'model';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The part shown is the deepest one given. The parts above it say where it sits.
const { areaConfig, entityConfig, eventConfig, eventQueryLocalisedConfigs, modelConfig, modelIsLoading, modelReferenceConfig } = defineProps<{
    areaConfig: ContextAreaConfig;
    modelReferenceConfig?: ContextModelReferenceConfig | undefined;
    modelConfig?: ContextModelConfig | null | undefined; // The model's own data, which loads separately and holds its entities.
    modelIsLoading?: boolean;
    entityConfig?: ContextEntityConfig | undefined;
    eventConfig?: ContextEventConfig | undefined;
    eventQueryLocalisedConfigs?: LocalisedConfig<EventQueryConfig>[]; // On an event: the event queries saved for it.
}>();
defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const documentScrollElement = shallowRef<HTMLElement>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Part
const typeId = computed((): ContextPartTypeId => {
    if (entityConfig && eventConfig) return 'event';
    if (entityConfig) return 'entity';
    return modelReferenceConfig ? 'model' : 'area';
});
const areaLabel = computed(() => localiseConfig(areaConfig, localeId.value).label);
const modelLabel = computed(() => (modelReferenceConfig ? localiseReference(modelReferenceConfig, localeId.value).label : ''));
const entityLabel = computed(() => (entityConfig ? localiseText(entityConfig.label, localeId.value) : ''));
const part = computed(() => {
    if (entityConfig && eventConfig) return { label: localiseText(eventConfig.labelAction, localeId.value), description: localiseText(eventConfig.description, localeId.value) };
    if (entityConfig) return { label: entityLabel.value, description: localiseText(entityConfig.description, localeId.value) };
    if (modelReferenceConfig) return { label: modelLabel.value, description: localiseReference(modelReferenceConfig, localeId.value).description };
    return { label: areaLabel.value, description: localiseConfig(areaConfig, localeId.value).description };
});

// ── Location ─ The parts above this one, from the area down. An area sits straight in the context, so it has none.
const locationFacts = computed(() => {
    const facts = [{ id: 'area', label: t(TEXT, 'location.area.label'), value: areaLabel.value }];
    if (typeId.value === 'entity' || typeId.value === 'event') facts.push({ id: 'model', label: t(TEXT, 'location.model.label'), value: modelLabel.value });
    if (typeId.value === 'event') facts.push({ id: 'entity', label: t(TEXT, 'location.entity.label'), value: entityLabel.value });
    return typeId.value === 'area' ? [] : facts;
});

// ── Contents ─ What the part holds, which the diagram shows one level below it. A model's entities are not known until
// its data loads.
const contents = computed(() => {
    switch (typeId.value) {
        case 'area':
            return { title: t(TEXT, 'contents.models.title'), labels: areaConfig.models.map((config) => localiseReference(config, localeId.value).label), isPending: false };
        case 'model': {
            const labels = (modelConfig?.entities ?? []).map((config) => localiseText(config.label, localeId.value));
            return { title: t(TEXT, 'contents.entities.title'), labels, isPending: modelIsLoading };
        }
        case 'entity':
            return {
                title: t(TEXT, 'contents.events.title'),
                labels: (entityConfig?.events ?? []).map((config) => localiseText(config.labelAction, localeId.value)),
                isPending: false
            };
        case 'event':
            return { title: t(TEXT, 'contents.eventQueries.title'), labels: (eventQueryLocalisedConfigs ?? []).map((config) => config.label), isPending: false };
    }
});
</script>

<template>
    <StudioDetailLayout data-region="ContextPartDetail">
        <ScrollArea
            class="flex-1"
            scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)"
            scroll-area-padding-left="var(--spacing-page)"
            @initialised="documentScrollElement = $event"
        >
            <StudioDocumentPanel :overline="t(TEXT, `${typeId}.label`)" :title="part.label" @close="$emit('close')">
                <!-- Description ─ A part with none says so, rather than leaving a gap under its name. -->
                <p v-if="part.description">{{ part.description }}</p>
                <p v-else class="text-muted">{{ t(TEXT, 'description.none.text') }}</p>

                <!-- Location ─ Laid out as the event query panel's lists are: a line under every row but the last, and a
                     label column that widens to fit its longest label. -->
                <StudioDocumentSection v-if="locationFacts.length > 0" :title="t(TEXT, 'location.title')">
                    <dl class="grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4">
                        <template v-for="fact in locationFacts" :key="fact.id">
                            <dt class="text-muted">{{ fact.label }}</dt>
                            <dd class="m-0 min-w-0 wrap-break-word">{{ fact.value }}</dd>
                        </template>
                    </dl>
                </StudioDocumentSection>

                <StudioDocumentSection :title="contents.title">
                    <p v-if="contents.isPending" class="text-muted">{{ t(TEXT, 'contents.pending.text') }}</p>
                    <p v-else-if="contents.labels.length === 0" class="text-muted">{{ t(TEXT, 'contents.none.text') }}</p>
                    <ul v-else class="text-sm *:border-b *:border-separator *:py-1 *:last:border-b-0">
                        <li v-for="(label, index) in contents.labels" :key="index" class="wrap-break-word">{{ label }}</li>
                    </ul>
                </StudioDocumentSection>
            </StudioDocumentPanel>
        </ScrollArea>

        <!-- Scroll Buttons ─ In the bottom row, because floating notices sit just above it. -->
        <ScrollEndButtons class="absolute right-6 bottom-(--safe-bottom-offset)" :scroll-element="documentScrollElement" />
    </StudioDetailLayout>
</template>
