// ── External Dependencies & Registrations
import { computed, type ComputedRef, type MaybeRefOrGetter, type Ref, toValue } from 'vue';
import { type LocationQuery, type RouteLocationRaw, useRoute } from 'vue-router';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig, LocaleId } from '@dpuse/dpuse-shared';
import { localiseConfig, localiseReference } from '@dpuse/dpuse-shared';

// ── Local Framework
import { contextConfig } from '@/state/configs';
import type { ContextDiagramFocus } from './_contextDiagram';
import { localiseText, useContextModel } from '@/state/contextModels';
import type { TaskTrailContent, TaskTrailItem } from '@/components/ui/taskTrail';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type ContextAreaConfig = ContextConfig['areas'][number];
export type ContextModelReferenceConfig = ContextAreaConfig['models'][number];
export type ContextEntityConfig = ContextModelConfig['entities'][number];
export type ContextEventConfig = ContextEntityConfig['events'][number];

// The area, model, entity and event the diagram is drilled down to, each undefined above the level shown.
interface ContextDiagramFocusConfigs {
    areaConfig: ContextAreaConfig | undefined;
    modelReferenceConfig: ContextModelReferenceConfig | undefined;
    entityConfig: ContextEntityConfig | undefined;
    eventConfig?: ContextEventConfig | undefined;
}

interface ContextDiagramFocusState {
    focus: ComputedRef<ContextDiagramFocus>;
    focusedAreaConfig: ComputedRef<ContextAreaConfig | undefined>;
    focusedEntityConfig: ComputedRef<ContextEntityConfig | undefined>;
    focusedEventConfig: ComputedRef<ContextEventConfig | undefined>;
    focusedModelConfig: Ref<ContextModelConfig | null | undefined>;
    focusedModelIsLoading: ComputedRef<boolean>;
    focusedModelReferenceConfig: ComputedRef<ContextModelReferenceConfig | undefined>;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// How far the context diagram has been drilled down. The URL is its one source by default, so reload, deep links and
// back/forward all land on the same level, and the diagram and the screen's trail always agree. A caller can name the
// level instead, such as the event of the event query selected in the list. An id the context does not have counts as
// no focus at that level.
export function useContextDiagramFocus(focusIds?: MaybeRefOrGetter<ContextDiagramFocus>): ContextDiagramFocusState {
    const route = useRoute();
    const ids = computed(() => (focusIds == null ? readContextDiagramFocus(route.params) : toValue(focusIds)));
    const focusedAreaConfig = computed(() => contextConfig.value?.areas.find((config) => config.id === ids.value.areaId));
    const focusedModelReferenceConfig = computed(() => focusedAreaConfig.value?.models.find((config) => config.id === ids.value.modelId));
    const { data: focusedModelConfig, isFetching: focusedModelIsFetching } = useContextModel(() => focusedModelReferenceConfig.value?.id);
    const focusedModelIsLoading = computed(() => focusedModelReferenceConfig.value != null && focusedModelIsFetching.value);
    const focusedEntityConfig = computed(() => focusedModelConfig.value?.entities.find((config) => config.id === ids.value.entityId));
    const focusedEventConfig = computed(() => focusedEntityConfig.value?.events.find((config) => config.id === ids.value.eventId));
    const focus = computed((): ContextDiagramFocus => ({
        areaId: focusedAreaConfig.value?.id,
        modelId: focusedModelReferenceConfig.value?.id,
        entityId: focusedEntityConfig.value?.id,
        eventId: focusedEventConfig.value?.id
    }));
    return { focus, focusedAreaConfig, focusedEntityConfig, focusedEventConfig, focusedModelConfig, focusedModelIsLoading, focusedModelReferenceConfig };
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The level the URL names, in the diagram route's path. A part that is left out is empty, which names no level.
export function readContextDiagramFocus(parameters: Record<string, unknown>): ContextDiagramFocus {
    const { areaId, modelId, entityId, eventId } = parameters;
    return { areaId: readPathPart(areaId), modelId: readPathPart(modelId), entityId: readPathPart(entityId), eventId: readPathPart(eventId) };
}

// The diagram at a level, with an event query selected under its event when one is given.
export function constructContextDiagramRoute({ areaId, modelId, entityId, eventId }: ContextDiagramFocus, query: LocationQuery, eventQueryId?: string): RouteLocationRaw {
    return { name: 'eventQueryDiagram', params: { areaId, modelId, entityId, eventId, eventQueryId }, query };
}

// The context, then the area, model, entity and event drilled down to. Each crumb above the level shown goes back up to
// its level. The last one is where the user is, so it is text.
export function constructContextDiagramTrail(
    currentContextConfig: ContextConfig,
    { areaConfig, modelReferenceConfig, entityConfig, eventConfig }: ContextDiagramFocusConfigs,
    localeId: LocaleId,
    query: LocationQuery,
    label: string
): TaskTrailContent {
    const areaId = areaConfig?.id;
    const modelId = modelReferenceConfig?.id;
    const entityId = entityConfig?.id;
    const levels: (TaskTrailItem & { focus: ContextDiagramFocus })[] = [{ id: 'context', label: localiseConfig(currentContextConfig, localeId).label, focus: {} }];
    if (areaConfig) levels.push({ id: 'area', label: localiseConfig(areaConfig, localeId).label, focus: { areaId } });
    if (modelReferenceConfig) levels.push({ id: 'model', label: localiseReference(modelReferenceConfig, localeId).label, focus: { areaId, modelId } });
    if (entityConfig) levels.push({ id: 'entity', label: localiseText(entityConfig.label, localeId), focus: { areaId, modelId, entityId } });
    if (entityConfig && eventConfig)
        levels.push({ id: 'event', label: localiseText(eventConfig.labelAction, localeId), focus: { areaId, modelId, entityId, eventId: eventConfig.id } });

    const items = levels.map(({ focus, ...item }, index): TaskTrailItem => (index < levels.length - 1 ? { ...item, to: constructContextDiagramRoute(focus, query) } : item));
    return { items, label };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function readPathPart(part: unknown): string | undefined {
    return typeof part === 'string' && part !== '' ? part : undefined;
}
