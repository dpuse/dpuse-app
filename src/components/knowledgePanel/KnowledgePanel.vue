<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { type Component, computed, defineAsyncComponent } from 'vue';

// App Components - Lazy loaded as required.
const KnowledgeAboutPanel = defineAsyncComponent(() => import('./KnowledgeAboutPanel.vue'));
const KnowledgeChatPanel = defineAsyncComponent(() => import('./KnowledgeChatPanel.vue'));
const KnowledgeLibraryPanel = defineAsyncComponent(() => import('./KnowledgeLibraryPanel.vue'));

// Properties & Emits
const { workbenchPaneIsHidden } = defineProps<{ workbenchPaneIsHidden: boolean }>();

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type KnowledgePanelTypeId = 'about' | 'library' | 'chat';
const knowledgePanels: Record<KnowledgePanelTypeId, { component: Component; label: string }> = {
    about: { component: KnowledgeAboutPanel, label: 'About' },
    library: { component: KnowledgeLibraryPanel, label: 'Library' },
    chat: { component: KnowledgeChatPanel, label: 'Chat' }
};

// External State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

// Local States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activePanel = computed(() => {
    const parameter = route.query.knowledge as KnowledgePanelTypeId | undefined;
    return knowledgePanels[parameter ?? 'about'] ?? knowledgePanels.about;
});
</script>

<template>
    <div class="flex h-full min-w-0 flex-1 flex-col">
        <!-- <Header :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]" :title="activePanel.label" :workbench-pane-is-hidden="workbenchPaneIsHidden" /> -->

        <component
            :is="activePanel.component"
            :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]"
            :title="activePanel.label"
            :workbench-pane-is-hidden="workbenchPaneIsHidden"
        />
    </div>
</template>
