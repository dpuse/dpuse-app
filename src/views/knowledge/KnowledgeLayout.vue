<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { type Component, computed, defineAsyncComponent } from 'vue';

// App Components - Lazy loaded as required.
const AboutView = defineAsyncComponent(() => import('./AboutView.vue'));
const ChatView = defineAsyncComponent(() => import('./ChatView.vue'));
const LibraryView = defineAsyncComponent(() => import('./LibraryView.vue'));

// Properties & Emits
const { workbenchPaneIsHidden } = defineProps<{ workbenchPaneIsHidden: boolean }>();

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type KnowledgeViewId = 'about' | 'library' | 'chat';
const KNOWLEDGE_PANELS: Record<KnowledgeViewId, { component: Component; label: string }> = {
    about: { component: AboutView, label: 'About' },
    library: { component: LibraryView, label: 'Library' },
    chat: { component: ChatView, label: 'Chat' }
};

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeView = computed(() => {
    const parameter = route.query.kView as KnowledgeViewId | undefined;
    return KNOWLEDGE_PANELS[parameter ?? 'about'] ?? KNOWLEDGE_PANELS.about;
});
</script>

<template>
    <div class="flex h-full min-w-0 flex-1 flex-col">
        <!-- <Header :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]" :title="activeView.label" :workbench-pane-is-hidden="workbenchPaneIsHidden" /> -->

        <component
            :is="activeView.component"
            :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]"
            :title="activeView.label"
            :workbench-pane-is-hidden="workbenchPaneIsHidden"
        />
    </div>
</template>
