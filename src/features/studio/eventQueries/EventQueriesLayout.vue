<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { contextConfig } from '@/state/configs';
import type { TaskTrailContent } from '@/components/ui/taskTrail';
import { TEXT } from './EventQueriesLayout_.json';
import { workspaceStoreId } from '@/services/workspaceStore';
import { constructContextDiagramTrail, useContextDiagramFocus } from './_contextDiagramFocus';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';
import { localeId, t } from '@/state/locale';

// ── Static Components
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue';
import TaskLayout, { type TaskLayoutView } from '@/features/studio/_components/TaskLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const { focusedAreaConfig, focusedEntityConfig, focusedModelReferenceConfig } = useContextDiagramFocus();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Views ─ The context diagram opens first, because an event query is made for an event in the context. The saved
// event queries are one tab away.
const viewItems = computed((): TaskLayoutView[] => [
    { id: 'eventQueryDiagram', label: t(TEXT, 'diagram.label'), to: { name: 'eventQueryDiagram', query: route.query } },
    { id: 'eventQueryList', label: t(TEXT, 'list.label'), to: { name: 'eventQueryList', query: route.query } }
]);

// ── Trail ─ The level the diagram is drilled down to, worked out from the route, so it does not change as the diagram
// redraws. The list has no level to show.
const trail = computed((): TaskTrailContent => {
    const label = t(TEXT, 'trail.aria');
    if (route.name !== 'eventQueryDiagram' || contextConfig.value == null) return { items: [], label };
    const focusConfigs = { areaConfig: focusedAreaConfig.value, modelReferenceConfig: focusedModelReferenceConfig.value, entityConfig: focusedEntityConfig.value };
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
        :overline="t(TEXT, 'studio.label')"
        :title="t(TEXT, 'contextualiseData.title')"
        :to="{ name: 'studio', query: route.query }"
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
