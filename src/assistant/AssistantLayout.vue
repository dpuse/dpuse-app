<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronDownIcon, InfoIcon, LibraryBigIcon, MessageCircleMoreIcon, SearchIcon } from '@lucide/vue';
import { type Component, computed, defineAsyncComponent, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { type AssistantModelConfig, CHAT_MODEL_CONFIGS, LIBRARY_MODEL_CONFIGS } from './modelConfigs';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ListItemButton from '@/components/ui/button/ListItemButton.vue';

// ── Local Components - Dynamic
const AboutView = defineAsyncComponent(() => import('./AboutPanel.vue'));
const ChatView = defineAsyncComponent(() => import('./ChatPanel.vue'));
const LibraryView = defineAsyncComponent(() => import('./LibraryPanel.vue'));
const TraditionalSearchView = defineAsyncComponent(() => import('./TraditionalSearchPanel.vue'));

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type AssistantViewId = 'about' | 'chat' | 'library' | 'search';
type AssistantModeId = 'chat' | 'library' | 'search';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CHAT_MODEL_ID_KEY = 'dpuse-assistantChatModelId';
const LIBRARY_MODEL_ID_KEY = 'dpuse-assistantLibraryModelId';

const ASSISTANT_PANELS: Record<AssistantViewId, { component: Component; label: string }> = {
    about: { component: AboutView, label: 'About' },
    library: { component: LibraryView, label: 'Library' },
    chat: { component: ChatView, label: 'Chat' },
    search: { component: TraditionalSearchView, label: 'Traditional Search' }
};

const ASSISTANT_VIEW_IDS = new Set<AssistantViewId>(['about', 'chat', 'library', 'search']);

// The vendor's candidate models by view id — About and Traditional Search have no vendor, so they're absent here.
const VIEW_MODEL_CONFIGS: Partial<Record<AssistantViewId, AssistantModelConfig[]>> = { chat: CHAT_MODEL_CONFIGS, library: LIBRARY_MODEL_CONFIGS };

// The assistant's three modes of operation — each with its own UI — switched between via the mode menu below.
// 'about' is not a mode of operation, so it's kept as a separate, always-visible status bar entry.
// 'library' runs on the Tanstack AI SDK, 'chat' on the Vercel AI SDK — both are kept in parallel until one is chosen.
const ASSISTANT_MODES: { id: AssistantModeId; icon: Component; label: string }[] = [
    { id: 'library', icon: LibraryBigIcon, label: 'Library' },
    { id: 'chat', icon: MessageCircleMoreIcon, label: 'Chat' },
    { id: 'search', icon: SearchIcon, label: 'Traditional Search' }
];

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { studioPaneIsHidden } = defineProps<{ studioPaneIsHidden: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const chatModelId = ref(establishModelId(CHAT_MODEL_ID_KEY, CHAT_MODEL_CONFIGS));
const libraryModelId = ref(establishModelId(LIBRARY_MODEL_ID_KEY, LIBRARY_MODEL_CONFIGS));

const modeMenuIsOpen = ref(false);
const modeMenuReference = useTemplateRef<HTMLElement>('modeMenuReference');

const modelMenuIsOpen = ref(false);
const modelMenuReference = useTemplateRef<HTMLElement>('modelMenuReference');

const statusText = ref('');

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeViewId = computed<AssistantViewId>(() => {
    const parameter = route.query.aView as AssistantViewId | undefined;
    return parameter != null && ASSISTANT_VIEW_IDS.has(parameter) ? parameter : 'about';
});

const activeView = computed(() => ASSISTANT_PANELS[activeViewId.value]);

const activeMode = computed(() => ASSISTANT_MODES.find((mode) => mode.id === activeViewId.value) ?? ASSISTANT_MODES[0]);

// The vendor's candidate models for the active mode — undefined when the active view has no vendor (About, Traditional Search).
const activeModelConfigs = computed(() => VIEW_MODEL_CONFIGS[activeViewId.value]);

const activeModelConfig = computed<AssistantModelConfig | undefined>(() => {
    const configs = activeModelConfigs.value;
    const selectedId = (activeViewId.value === 'library' ? libraryModelId : chatModelId).value;
    return configs == null ? undefined : (configs.find((config) => config.id === selectedId) ?? configs[0]);
});

// Keying on the model config forces the panel to remount (and so re-establish its client/session) whenever the model changes.
const activePanelKey = computed(() => `${activeViewId.value}:${activeModelConfig.value?.id ?? ''}`);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

document.addEventListener('pointerdown', handleDocumentPointerDown, { capture: true });
onUnmounted(() => document.removeEventListener('pointerdown', handleDocumentPointerDown, { capture: true }));

watch(chatModelId, (newModelId) => localStorage.setItem(CHAT_MODEL_ID_KEY, newModelId));
watch(libraryModelId, (newModelId) => localStorage.setItem(LIBRARY_MODEL_ID_KEY, newModelId));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleDocumentPointerDown(event: PointerEvent): void {
    const target = event.target as Element;
    if (modeMenuIsOpen.value && modeMenuReference.value?.contains(target) !== true) modeMenuIsOpen.value = false;
    if (modelMenuIsOpen.value && modelMenuReference.value?.contains(target) !== true) modelMenuIsOpen.value = false;
}

function handleSelectView(viewId: AssistantViewId): void {
    modeMenuIsOpen.value = false;
    if (activeViewId.value === viewId) return;
    statusText.value = '';
    router.replace({ query: { ...route.query, aView: viewId } });
}

function handleSelectModel(modelConfig: AssistantModelConfig): void {
    modelMenuIsOpen.value = false;
    if (activeViewId.value === 'library') libraryModelId.value = modelConfig.id;
    else if (activeViewId.value === 'chat') chatModelId.value = modelConfig.id;
}

function handleStatusChange(status: string): void {
    statusText.value = status;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishModelId(key: string, configs: AssistantModelConfig[]): string {
    try {
        const storedId = localStorage.getItem(key);
        if (storedId != null && configs.some((config) => config.id === storedId)) return storedId;
    } catch {
        // Ignore - fall back to the default model.
    }
    return configs[0].id;
}
</script>

<template>
    <div class="flex h-full min-w-0 flex-col">
        <component
            :is="activeView.component"
            :key="activePanelKey"
            :breadcrumbs="[{ id: 'assistant', label: 'Assistant' }]"
            :model-config="activeModelConfig"
            :studio-pane-is-hidden="studioPaneIsHidden"
            :title="activeView.label"
            @status-change="handleStatusChange"
        />

        <!-- Status Bar - shared across About, Library, Chat & Traditional Search. -->
        <div class="mx-4 flex h-(--status-bar-height) flex-none items-center gap-x-3 border-t border-separator text-xs" data-region="AssistantStatusBar">
            <Button
                aria-label="About"
                class="border-y-2 border-b-transparent py-1.25"
                :class="activeViewId === 'about' ? 'border-t-blue-400' : 'border-t-transparent'"
                shape="minimal"
                @click="handleSelectView('about')"
            >
                <InfoIcon aria-hidden="true" class="size-4.5" :stroke-width="1.25" />
            </Button>

            <div ref="modeMenuReference" class="relative">
                <Button
                    aria-haspopup="true"
                    :aria-expanded="modeMenuIsOpen"
                    aria-label="Select assistant mode"
                    class="flex items-center gap-x-1.5 border-y-2 border-b-transparent py-1.25"
                    :class="activeViewId !== 'about' ? 'border-t-blue-400' : 'border-t-transparent'"
                    shape="minimal"
                    @click="
                        modeMenuIsOpen = !modeMenuIsOpen;
                        modelMenuIsOpen = false;
                    "
                >
                    <component :is="activeMode.icon" aria-hidden="true" class="size-4.5" :stroke-width="1.25" />
                    <span>{{ activeMode.label }}</span>
                    <ChevronDownIcon aria-hidden="true" class="size-3.5" :stroke-width="1.25" />
                </Button>

                <div v-if="modeMenuIsOpen" class="absolute bottom-full left-0 z-10 mb-1 min-w-46 rounded-md border border-separator bg-surface p-1 text-sm shadow-md" role="menu">
                    <ListItemButton
                        v-for="mode in ASSISTANT_MODES"
                        :key="mode.id"
                        class="mt-0.5 flex items-center gap-x-2 first:mt-0"
                        :is-active="activeViewId === mode.id"
                        role="menuitem"
                        @click="handleSelectView(mode.id)"
                    >
                        <component :is="mode.icon" aria-hidden="true" class="size-4" :stroke-width="1.25" />
                        {{ mode.label }}
                    </ListItemButton>
                </div>
            </div>

            <template v-if="activeModelConfig != null && activeModelConfigs != null">
                <div class="h-4 w-px flex-none bg-separator" />

                <div ref="modelMenuReference" class="relative">
                    <Button
                        aria-haspopup="true"
                        :aria-expanded="modelMenuIsOpen"
                        aria-label="Select model"
                        class="flex items-center gap-x-1.5 py-1.25"
                        shape="minimal"
                        @click="
                            modelMenuIsOpen = !modelMenuIsOpen;
                            modeMenuIsOpen = false;
                        "
                    >
                        <span>{{ activeModelConfig.providerLabel }} · {{ activeModelConfig.modelId }}</span>
                        <ChevronDownIcon aria-hidden="true" class="size-3.5" :stroke-width="1.25" />
                    </Button>

                    <div v-if="modelMenuIsOpen" class="absolute bottom-full left-0 z-10 mb-1 min-w-56 rounded-md border border-separator bg-surface p-1 text-sm shadow-md" role="menu">
                        <ListItemButton
                            v-for="modelConfig in activeModelConfigs"
                            :key="modelConfig.id"
                            class="mt-0.5 flex flex-col items-start first:mt-0"
                            :is-active="activeModelConfig.id === modelConfig.id"
                            role="menuitem"
                            @click="handleSelectModel(modelConfig)"
                        >
                            <span>{{ modelConfig.providerLabel }}</span>
                            <span class="text-xs text-muted">{{ modelConfig.modelId }}</span>
                        </ListItemButton>
                    </div>
                </div>
            </template>

            <div class="flex-1 truncate text-right text-muted">{{ statusText }}</div>
        </div>
    </div>
</template>
