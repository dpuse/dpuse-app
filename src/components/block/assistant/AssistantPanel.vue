<script setup lang="ts">
// External dependencies
import { useRoute } from 'vue-router';
import { type Component, computed, ref } from 'vue';

// Workbench components
import AssistantHome from './AssistantHomePanel.vue';
import AssistantPanelContent from './AssistantChatPanel.vue';
import AssistantSearch from './AssistantSearchPanel.vue';
import Header from '@/components/block/header/Header.vue';

// Properties
defineProps<{ isWideDisplay: boolean }>();

const route = useRoute();

const assistantViews: Record<string, Component> = {
    home: AssistantHome,
    search: AssistantSearch,
    chat: AssistantPanelContent
};

const activeView = computed(() => {
    const parameter = route.query.assistant as string | undefined;
    return assistantViews[parameter ?? 'home'] ?? assistantViews.home;
});
</script>

<template>
    <div class="bg-background-primary flex min-w-0 flex-1 flex-col">
        <Header :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]" title="Assistant" :is-assist-panel-open-in-wide-display="false" :is-wide-display="isWideDisplay" />

        <component :is="activeView" :is-wide-display="isWideDisplay" />
    </div>
</template>
