<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { type Component, computed, ref, watch } from 'vue';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities/index.ts';
import { ASSISTANT_MODEL_CONFIGS, type AssistantModelConfig } from '../chat/modelConfigs';

// ── Static Components
import AssistantHeader from './AssistantHeader.vue';
import Separator from '~/src/components/ui/Separator.vue';

// ── Dynamic Components
const ChatView = defineAsyncPanel(() => import('../chat/ChatPanel.vue'), 'ChatPanel');
const InfoView = defineAsyncPanel(() => import('../info/InfoPanel.vue'), 'InfoPanel');
const LibraryView = defineAsyncPanel(() => import('../library/LibraryPanel.vue'), 'LibraryPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ASSISTANT_VIEW_IDS = new Set<string>(['about', 'chat', 'library']);

const MODEL_ID_KEY = 'dpuse-assistantModelId';

const ASSISTANT_PANELS: Record<string, Component> = {
    about: InfoView,
    chat: ChatView,
    library: LibraryView
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { studioPaneIsHidden } = defineProps<{ studioPaneIsHidden: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const modelId = ref(establishModelId());

const route = useRoute();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeViewId = computed<string>(() => {
    const parameter = route.query.aView as string | undefined;
    return parameter != null && ASSISTANT_VIEW_IDS.has(parameter) ? parameter : 'chat';
});

const activeView = computed(() => ASSISTANT_PANELS[activeViewId.value]);

// The selected model — only meaningful while viewing Chat.
const activeModelConfig = computed<AssistantModelConfig>(() => ASSISTANT_MODEL_CONFIGS.find((config) => config.id === modelId.value) ?? ASSISTANT_MODEL_CONFIGS[0]);

// Keyed on the view alone. A model change must not remount the panel: the session takes the new model in place, so the
// conversation carries over and the next answer simply comes from the new model.
const activePanelKey = computed(() => activeViewId.value);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(modelId, (newModelId) => {
    localStorage.setItem(MODEL_ID_KEY, newModelId);
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleModelChange(newModelConfig: AssistantModelConfig): void {
    modelId.value = newModelConfig.id;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishModelId(): string {
    try {
        const storedId = localStorage.getItem(MODEL_ID_KEY);
        if (storedId != null && ASSISTANT_MODEL_CONFIGS.some((config) => config.id === storedId)) return storedId;
    } catch {
        // Ignore - fall back to the default model.
    }
    return ASSISTANT_MODEL_CONFIGS[0].id;
}
</script>

<template>
    <div class="relative flex h-full min-w-0 flex-col">
        <AssistantHeader class="mx-4 flex-none" :title="'Assistant'" />

        <Separator />

        <component
            :is="activeView"
            :key="activePanelKey"
            :model-config="activeModelConfig"
            :model-configs="ASSISTANT_MODEL_CONFIGS"
            :studio-pane-is-hidden="studioPaneIsHidden"
            @model-change="handleModelChange"
        />
    </div>
</template>
