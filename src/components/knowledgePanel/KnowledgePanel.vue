<script setup lang="ts">
// External dependencies
import { useRoute } from 'vue-router';
import { type Component, computed, defineAsyncComponent } from 'vue';

// App components
import Header from '@/components/header/Header.vue';
import KnowledgeOverviewPanel from './KnowledgeOverviewPanel.vue';

// App components (lazy loaded)
const KnowledgeChatPanel = defineAsyncComponent(() => import('./KnowledgeChatPanel.vue'));
const KnowledgeSearchPanel = defineAsyncComponent(() => import('./KnowledgeSearchPanel.vue'));

// Properties
defineProps<{ isWideDisplay: boolean }>();

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
        <Header :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]" :title="activeView.label" :is-assist-panel-open-in-wide-display="false" :is-wide-display="isWideDisplay" />

        <component :is="activeView.component" :is-wide-display="isWideDisplay" />
    </div>
</template>
