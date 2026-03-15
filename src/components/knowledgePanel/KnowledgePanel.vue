<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { type Component, computed, defineAsyncComponent } from 'vue';

// App Components - Statically imported so always available, even after app goes offline.
import Header from '@/components/header/Header.vue';

// App Components - Lazy loaded as required.
const KnowledgeChatPanel = defineAsyncComponent(() => import('./KnowledgeChatPanel.vue'));
const KnowledgeSearchPanel = defineAsyncComponent(() => import('./KnowledgeSearchPanel.vue'));
const KnowledgeOverviewPanel = defineAsyncComponent(() => import('./KnowledgeOverviewPanel.vue'));

// Properties & Emits
const { workbenchPaneIsHidden } = defineProps<{ workbenchPaneIsHidden: boolean }>();

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type PanelTypeId = 'welcome' | 'search' | 'chat';
const knowledgePanels: Record<PanelTypeId, { component: Component; label: string }> = {
    welcome: { component: KnowledgeOverviewPanel, label: 'Overview' },
    search: { component: KnowledgeSearchPanel, label: 'Explore' },
    chat: { component: KnowledgeChatPanel, label: 'Chat' }
};

// External State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

// Local States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activePanel = computed(() => {
    const parameter = route.query.knowledge as PanelTypeId | undefined;
    return knowledgePanels[parameter ?? 'welcome'] ?? knowledgePanels.welcome;
});
</script>

<template>
    <div class="flex h-full min-w-0 flex-1 flex-col">
        <Header :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]" :title="activePanel.label" :workbench-pane-is-hidden="workbenchPaneIsHidden" />

        <component :is="activePanel.component" />
    </div>
</template>
