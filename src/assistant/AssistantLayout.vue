<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { type Component, computed, defineAsyncComponent } from 'vue';

// ── Local Components - Dynamic
const AboutView = defineAsyncComponent(() => import('./AboutPanel.vue'));
const ChatView = defineAsyncComponent(() => import('./ChatPanel.vue'));
const LibraryView = defineAsyncComponent(() => import('./LibraryPanel.vue'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

export type AssistantViewId = 'about' | 'library' | 'chat';
const ASSISTANT_PANELS: Record<AssistantViewId, { component: Component; label: string }> = {
    about: { component: AboutView, label: 'About' },
    library: { component: LibraryView, label: 'Library' },
    chat: { component: ChatView, label: 'Chat' }
};

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { studioPaneIsHidden } = defineProps<{ studioPaneIsHidden: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeView = computed(() => {
    const parameter = route.query.kView as AssistantViewId | undefined;
    return ASSISTANT_PANELS[parameter ?? 'about'] ?? ASSISTANT_PANELS.about;
});
</script>

<template>
    <div class="flex h-full min-w-0 flex-col">
        <component :is="activeView.component" :breadcrumbs="[{ id: 'assistant', label: 'Assistant' }]" :title="activeView.label" :studio-pane-is-hidden="studioPaneIsHidden" />
    </div>
</template>
