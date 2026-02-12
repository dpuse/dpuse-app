<script setup lang="ts">
// External dependencies
import { useRoute } from 'vue-router';
import { computed, ref, type Component } from 'vue';

// Workbench components
import AssistantPanelContent from './AssistantPanelContent.vue';
import KnowledgeHome from './KnowledgeHome.vue';
import KnowledgeSearch from './KnowledgeSearch.vue';

// Properties
defineProps<{ isWideDisplay: boolean }>();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

const assistantViews: Record<string, Component> = {
    home: KnowledgeHome,
    search: KnowledgeSearch,
    chat: AssistantPanelContent
};

const activeView = computed(() => {
    const param = route.query.assistant as string | undefined;
    return assistantViews[param ?? 'home'] ?? assistantViews.home;
});

// Chat state (kept here so it persists across view switches)
const messages = ref<{ id: number; text: string }[]>([]);

function runTest(): void {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const raw = JSON.stringify({ message: 'Can I show the current state of all modules?' });
    const requestOptions: RequestInit = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
    fetch('https://api.datapos.app/ai/chat', requestOptions)
        .then((response) => response.json())
        .then((result) => {
            console.log(result);
            const id = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
            messages.value.push({ id, text: JSON.stringify(result) });
        })
        .catch((error) => console.log('error', error));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
</script>

<template>
    <div class="bg-background-primary flex flex-1 flex-col">
        <component :is="activeView" :messages="messages" :on-run-test="runTest" :is-wide-display="isWideDisplay" />
    </div>
</template>
