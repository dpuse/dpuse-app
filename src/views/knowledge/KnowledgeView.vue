<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { type Component, computed, defineAsyncComponent } from 'vue';

// App Components & Views - Lazy loaded as required.
const AboutPanel = defineAsyncComponent(() => import('./AboutPanel.vue'));
const ChatPanel = defineAsyncComponent(() => import('./ChatPanel.vue'));
const LibraryPanel = defineAsyncComponent(() => import('./LibraryPanel.vue'));

// Properties & Emits
const { workbenchPaneIsHidden } = defineProps<{ workbenchPaneIsHidden: boolean }>();

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type KnowledgeViewId = 'about' | 'library' | 'chat';
const KNOWLEDGE_PANELS: Record<KnowledgeViewId, { component: Component; label: string }> = {
    about: { component: AboutPanel, label: 'About' },
    library: { component: LibraryPanel, label: 'Library' },
    chat: { component: ChatPanel, label: 'Chat' }
};

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activePanel = computed(() => {
    const parameter = route.query.kView as KnowledgeViewId | undefined;
    return KNOWLEDGE_PANELS[parameter ?? 'about'] ?? KNOWLEDGE_PANELS.about;
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
