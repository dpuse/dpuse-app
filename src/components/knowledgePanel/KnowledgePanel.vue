<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { type Component, computed, defineAsyncComponent } from 'vue';

// App Components
import Header from '@/components/header/Header.vue';
import KnowledgeOverviewPanel from './KnowledgeOverviewPanel.vue';

// App Components (lazy loaded)
const KnowledgeChatPanel = defineAsyncComponent(() => import('./KnowledgeChatPanel.vue'));
const KnowledgeSearchPanel = defineAsyncComponent(() => import('./KnowledgeSearchPanel.vue'));

// Properties
const { displayIsWide } = defineProps<{ displayIsWide: boolean }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

const knowledgePanels: Record<'welcome' | 'search' | 'chat', { component: Component; label: string }> = {
    welcome: { component: KnowledgeOverviewPanel, label: 'Overview' },
    search: { component: KnowledgeSearchPanel, label: 'Explore' },
    chat: { component: KnowledgeChatPanel, label: 'Chat' }
};

const activeView = computed(() => {
    const parameter = route.query.knowledge as 'welcome' | 'search' | 'chat' | undefined;
    return knowledgePanels[parameter ?? 'welcome'] ?? knowledgePanels.welcome;
});
</script>

<template>
    <div class="flex h-full min-w-0 flex-1 flex-col">
        <Header :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]" :title="activeView.label" :display-is-wide="displayIsWide" />

        <component :is="activeView.component" :display-is-wide="displayIsWide" />
    </div>
</template>
