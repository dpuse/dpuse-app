<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './EventQueriesLayout_.json';
import { workspaceStoreId } from '@/services/workspaceStore';
import { ignoreReportedNavigationFailure, navigationPendingDepth } from '@/router';

// ── Static Components
import RouterViewTransition from '@/components/ui/RouterViewTransition.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';
import TabBar from '@/components/ui/TabBar.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Views ─ The context diagram opens first, because an event query is made for an event in the context. The saved
// event queries are one tab away.
const viewTabItems = computed(() => [
    { id: 'eventQueries', label: t(TEXT, 'diagram.label'), to: { name: 'eventQueries', query: route.query } },
    { id: 'eventQueryList', label: t(TEXT, 'list.label'), to: { name: 'eventQueryList', query: route.query } }
]);

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
    <StudioLayout>
        <!-- Header -->
        <StudioHeader class="flex-none px-page" :overline="t(TEXT, 'studio.label')" :title="t(TEXT, 'contextualiseData.title')" :to="{ name: 'studio', query: route.query }" />

        <!-- Tab Bar -->
        <TabBar :active-id="String(route.name)" :aria-label="t(TEXT, 'views.aria')" :items="viewTabItems" />

        <!-- Diagram or List -->
        <RouterViewTransition v-slot="{ component }" class="min-h-0 flex-1" :is-loading="viewIsLoading">
            <component :is="component" class="min-h-0 flex-1" />
        </RouterViewTransition>
    </StudioLayout>
</template>
