<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { type Component, computed, defineAsyncComponent } from 'vue';

// App Dynamic Components
const AboutView = defineAsyncComponent(() => import('./AboutPanel.vue'));
const ChatView = defineAsyncComponent(() => import('./ChatPanel.vue'));
const LibraryView = defineAsyncComponent(() => import('./LibraryPanel.vue'));

// Constants ───────────────────────────────────────────────────────────────────────────────────────────────────────────

export type KnowledgeViewId = 'about' | 'library' | 'chat';
const KNOWLEDGE_PANELS: Record<KnowledgeViewId, { component: Component; label: string }> = {
    about: { component: AboutView, label: 'About' },
    library: { component: LibraryView, label: 'Library' },
    chat: { component: ChatView, label: 'Chat' }
};

// Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────────────────

const { workbenchPaneIsHidden } = defineProps<{ workbenchPaneIsHidden: boolean }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const activeView = computed(() => {
    const parameter = route.query.kView as KnowledgeViewId | undefined;
    return KNOWLEDGE_PANELS[parameter ?? 'about'] ?? KNOWLEDGE_PANELS.about;
});
</script>

<template>
    <div class="flex h-full min-w-0 flex-1 flex-col">
        <component
            :is="activeView.component"
            :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]"
            :title="activeView.label"
            :workbench-pane-is-hidden="workbenchPaneIsHidden"
        />
    </div>
</template>
