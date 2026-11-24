// ── External Dependencies & Registrations
import { computed, type ComputedRef, type Ref } from 'vue';
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

type ContextAreaConfig = ContextConfig['areas'][number];
type ContextModelReferenceConfig = ContextAreaConfig['models'][number];
type ContextEntityConfig = ContextModelConfig['entities'][number];

// The area, model and entity the diagram is drilled down to, each undefined above the level shown.
interface ContextDiagramFocusConfigs {
    areaConfig: ContextAreaConfig | undefined;
    modelReferenceConfig: ContextModelReferenceConfig | undefined;
    entityConfig: ContextEntityConfig | undefined;
}

interface ContextDiagramFocusState {
    focus: ComputedRef<ContextDiagramFocus>;
    focusedAreaConfig: ComputedRef<ContextAreaConfig | undefined>;
    focusedEntityConfig: ComputedRef<ContextEntityConfig | undefined>;
    focusedModelConfig: Ref<ContextModelConfig | null | undefined>;
    focusedModelIsLoading: ComputedRef<boolean>;
    focusedModelReferenceConfig: ComputedRef<ContextModelReferenceConfig | undefined>;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// How far the context diagram has been drilled down. The URL is its one source, so reload, deep links and back/forward
// all land on the same level, and the diagram and the screen's trail always agree. An id the context does not have
// counts as no focus at that level.
export function useContextDiagramFocus(): ContextDiagramFocusState {
    const route = useRoute();
    const focusedAreaConfig = computed(() => contextConfig.value?.areas.find((config) => config.id === route.params.areaId));
    const focusedModelReferenceConfig = computed(() => focusedAreaConfig.value?.models.find((config) => config.id === route.params.modelId));
    const { data: focusedModelConfig, isFetching: focusedModelIsFetching } = useContextModel(() => focusedModelReferenceConfig.value?.id);
    const focusedModelIsLoading = computed(() => focusedModelReferenceConfig.value != null && focusedModelIsFetching.value);
    const focusedEntityConfig = computed(() => focusedModelConfig.value?.entities.find((config) => config.id === route.params.entityId));
    const focus = computed((): ContextDiagramFocus => ({
        areaId: focusedAreaConfig.value?.id,
        modelId: focusedModelReferenceConfig.value?.id,
        entityId: focusedEntityConfig.value?.id
    }));
    return { focus, focusedAreaConfig, focusedEntityConfig, focusedModelConfig, focusedModelIsLoading, focusedModelReferenceConfig };
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function constructContextDiagramRoute({ areaId, modelId, entityId }: ContextDiagramFocus, query: LocationQuery): RouteLocationRaw {
    return { name: 'eventQueryDiagram', params: { areaId, modelId, entityId }, query };
}

// The context, then the area, model and entity drilled down to. Each crumb above the level shown goes back up to its
// level. The last one is where the user is, so it is text.
export function constructContextDiagramTrail(
    currentContextConfig: ContextConfig,
    { areaConfig, modelReferenceConfig, entityConfig }: ContextDiagramFocusConfigs,
    localeId: LocaleId,
    query: LocationQuery,
    label: string
): TaskTrailContent {
    const areaId = areaConfig?.id;
    const modelId = modelReferenceConfig?.id;
    const levels: (TaskTrailItem & { focus: ContextDiagramFocus })[] = [{ id: 'context', label: localiseConfig(currentContextConfig, localeId).label, focus: {} }];
    if (areaConfig) levels.push({ id: 'area', label: localiseConfig(areaConfig, localeId).label, focus: { areaId } });
    if (modelReferenceConfig) levels.push({ id: 'model', label: localiseReference(modelReferenceConfig, localeId).label, focus: { areaId, modelId } });
    if (entityConfig) levels.push({ id: 'entity', label: localiseText(entityConfig.label, localeId), focus: { areaId, modelId, entityId: entityConfig.id } });

    const items = levels.map(({ focus, ...item }, index): TaskTrailItem => (index < levels.length - 1 ? { ...item, to: constructContextDiagramRoute(focus, query) } : item));
    return { items, label };
}
