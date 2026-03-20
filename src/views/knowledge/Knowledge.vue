<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { type Component, computed, defineAsyncComponent } from 'vue';

// App Components & Views - Lazy loaded as required.
const About = defineAsyncComponent(() => import('./About.vue'));
const Chat = defineAsyncComponent(() => import('./Chat.vue'));
const Library = defineAsyncComponent(() => import('./Library.vue'));

// Properties & Emits
const { workbenchPaneIsHidden } = defineProps<{ workbenchPaneIsHidden: boolean }>();

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type KnowledgeViewId = 'about' | 'library' | 'chat';
const knowledgePanels: Record<KnowledgeViewId, { component: Component; label: string }> = {
    about: { component: About, label: 'About' },
    library: { component: Library, label: 'Library' },
    chat: { component: Chat, label: 'Chat' }
};

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

// Local States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activePanel = computed(() => {
    const parameter = route.query.kView as KnowledgeViewId | undefined;
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
