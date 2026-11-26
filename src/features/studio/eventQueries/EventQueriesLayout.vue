<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, watch } from 'vue';
import { GraphStarIcon, LayoutGridIcon } from '@lucide/vue';
import { type RouteLocationRaw, useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { contextConfig } from '@/state/configs';
import { resolveEventQueryDiagramFocus } from './_eventQueryDiagram';
import type { TaskTrailContent } from '@/components/ui/taskTrail';
import { TEXT } from './EventQueriesLayout_.json';
import { useEventQueries } from './_eventQueries';
import { workspaceStoreId } from '@/services/workspaceStore';
import { constructContextDiagramRoute, constructContextDiagramTrail, readContextDiagramFocus, useContextDiagramFocus } from './_contextDiagramFocus';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';

// ── Static Components
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue';
import TaskLayout, { type TaskLayoutView } from '@/features/studio/_components/TaskLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const { data: eventQueryConfigs } = useEventQueries();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Selection ─ The event query selected in either view. Its event is the level the trail shows and the diagram opens
// at.
const selectedEventQueryConfig = computed(() => eventQueryConfigs.value?.find((config) => config.id === route.params.eventQueryId));

// ── Views ─ The context diagram opens first, because an event query is made for an event in the context. The saved
// event queries are one click away. The diagram's icon leads, because it is the view the screen opens on, as on
// Establish Data Views. Each view opens with the selected event query still selected.
const viewItems = computed((): TaskLayoutView[] => {
    const eventQueryId = selectedEventQueryConfig.value?.id;
    const diagramRoute: RouteLocationRaw =
        selectedEventQueryConfig.value == null
            ? { name: 'eventQueryDiagram', query: route.query }
            : constructContextDiagramRoute(resolveEventQueryDiagramFocus({}, selectedEventQueryConfig.value), route.query, eventQueryId);
    return [
        { id: 'eventQueryDiagram', icon: GraphStarIcon, label: t(TEXT, 'diagram.label'), to: diagramRoute },
        { id: 'eventQueryList', icon: LayoutGridIcon, label: t(TEXT, 'list.label'), to: { name: 'eventQueryList', params: { eventQueryId }, query: route.query } }
    ];
});

// ── Trail ─ The same on the diagram and the list: the level of the selected event query's event, or else the level the
// diagram is drilled down to. It is worked out from the route, so it does not change as the diagram redraws. The list
// with nothing selected has no level to show, so it asks for an event query instead.
const { focusedAreaConfig, focusedEntityConfig, focusedEventConfig, focusedModelReferenceConfig } = useContextDiagramFocus(() =>
    resolveEventQueryDiagramFocus(route.name === 'eventQueryDiagram' ? readContextDiagramFocus(route.params) : {}, selectedEventQueryConfig.value)
);
const trail = computed((): TaskTrailContent => {
    const label = t(TEXT, 'trail.aria');
    if (route.name === 'eventQueryList' && selectedEventQueryConfig.value == null) return { emptyText: t(TEXT, 'trail.empty.list.text'), items: [], label };
    if (contextConfig.value == null) return { items: [], label };
    const focusConfigs = {
        areaConfig: focusedAreaConfig.value,
        modelReferenceConfig: focusedModelReferenceConfig.value,
        entityConfig: focusedEntityConfig.value,
        eventConfig: focusedEventConfig.value
    };
    return constructContextDiagramTrail(contextConfig.value, focusConfigs, localeId.value, route.query, label);
});

// The layout's own 'RouterView' sits one level in, so the layout shows the spinner while a view loads. 'App.vue' shows
// the spinner for the layout itself, which keeps the header and tabs in place.
const viewIsLoading = computed(() => navigationPendingDepth.value === 1);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Signing in or out moves to another account's store, where the selected event query does not exist, so the list
// shows nothing selected. The first store chosen after the session check is not a move.
watch(workspaceStoreId, (_newWorkspaceStoreId, oldWorkspaceStoreId) => {
    if (oldWorkspaceStoreId == null || route.name !== 'eventQueryList' || route.params.eventQueryId === '') return;
    void ignoreReportedNavigationFailure(router.replace({ name: 'eventQueryList', params: { eventQueryId: undefined }, query: route.query }));
});
</script>

<template>
    <TaskLayout
        :current-view-id="String(route.name)"
        :title="t(TEXT, 'contextualiseData.title')"
        :trail="trail"
        :view-items="viewItems"
        :views-label="t(TEXT, 'views.aria')"
    >
        <!-- Diagram or List -->
        <RouterViewTransition v-slot="{ component }" class="min-h-0 flex-1" :is-loading="viewIsLoading">
            <component :is="component" class="min-h-0 flex-1" />
        </RouterViewTransition>
    </TaskLayout>
</template>
