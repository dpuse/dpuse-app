<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';
import { type Component, computed, ref, watch } from 'vue';

// ── Local Framework
import { assertDefined, defineAsyncPanel } from '@/utilities/index.ts';
import { ASSISTANT_VENDOR_CONFIGS, type AssistantModelConfig, type AssistantVendorId } from '../chat/modelConfigs';

// ── Static Components
import AssistantPanelHeader from './AssistantPanelHeader.vue';

// ── Dynamic Components
const ChatView = defineAsyncPanel(() => import('../chat/ChatPanel.vue'), 'ChatPanel');
const InfoView = defineAsyncPanel(() => import('../info/InfoPanel.vue'), 'InfoPanel');
const LibraryView = defineAsyncPanel(() => import('../library/LibraryPanel.vue'), 'LibraryPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ASSISTANT_VIEW_IDS = new Set<string>(['about', 'chat', 'library']);

const VENDOR_ID_KEY = 'dpuse-assistantVendorId';
const VENDOR_MODEL_ID_KEY_PREFIX = 'dpuse-assistantVendorModelId-';

const ASSISTANT_PANELS: Record<string, Component> = {
    about: InfoView,
    chat: ChatView,
    library: LibraryView
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { studioPaneIsHidden } = defineProps<{ studioPaneIsHidden: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const vendorId = ref(establishVendorId());

// The last-selected model id per vendor, so switching vendor and back restores what you had. Keyed by vendor id.
const modelIdByVendorId = ref<Record<AssistantVendorId, string>>({
    tanstack: establishVendorModelId('tanstack'),
    vercel: establishVendorModelId('vercel')
});

const route = useRoute();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeViewId = computed<string>(() => {
    const parameter = route.query.aView as string | undefined;
    return parameter != null && ASSISTANT_VIEW_IDS.has(parameter) ? parameter : 'about';
});

const activeView = computed(() => ASSISTANT_PANELS[activeViewId.value]);

const activeVendorConfig = computed(() => ASSISTANT_VENDOR_CONFIGS.find((vendorConfig) => vendorConfig.id === vendorId.value) ?? ASSISTANT_VENDOR_CONFIGS[0]);

// The active vendor's selected model config — only meaningful while viewing Chat.
const activeModelConfig = computed<AssistantModelConfig>(() => {
    const modelConfigs = activeVendorConfig.value.modelConfigs;
    const selectedId = modelIdByVendorId.value[activeVendorConfig.value.id];
    return modelConfigs.find((config) => config.id === selectedId) ?? modelConfigs[0];
});

// Keying on the vendor+model forces the Chat panel to remount (and so re-establish its session) whenever either changes.
const activePanelKey = computed(() => `${activeViewId.value}:${vendorId.value}:${activeModelConfig.value.id}`);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(vendorId, (newVendorId) => {
    localStorage.setItem(VENDOR_ID_KEY, newVendorId);
});

watch(
    modelIdByVendorId,
    (newModelIdByVendorId) => {
        for (const [id, modelId] of Object.entries(newModelIdByVendorId)) localStorage.setItem(VENDOR_MODEL_ID_KEY_PREFIX + id, modelId);
    },
    { deep: true }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleVendorChange(newVendorId: AssistantVendorId, newModelConfig: AssistantModelConfig): void {
    vendorId.value = newVendorId;
    modelIdByVendorId.value = { ...modelIdByVendorId.value, [newVendorId]: newModelConfig.id };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishVendorId(): AssistantVendorId {
    try {
        const storedId = localStorage.getItem(VENDOR_ID_KEY);
        if (ASSISTANT_VENDOR_CONFIGS.some((vendorConfig) => vendorConfig.id === storedId)) return storedId as AssistantVendorId;
    } catch {
        // Ignore - fall back to the default vendor.
    }
    return ASSISTANT_VENDOR_CONFIGS[0].id;
}

function establishVendorModelId(id: AssistantVendorId): string {
    const vendorConfig = assertDefined(
        ASSISTANT_VENDOR_CONFIGS.find((config) => config.id === id),
        `No vendor config found for id '${id}'.`
    );
    const modelConfigs = vendorConfig.modelConfigs;
    try {
        const storedId = localStorage.getItem(VENDOR_MODEL_ID_KEY_PREFIX + id);
        if (storedId != null && modelConfigs.some((config) => config.id === storedId)) return storedId;
    } catch {
        // Ignore - fall back to the default model.
    }
    return modelConfigs[0].id;
}
</script>

<template>
    <div class="flex h-full min-w-0 flex-col">
        <AssistantPanelHeader :title="'Assistant'" />

        <component
            :is="activeView"
            :key="activePanelKey"
            :model-config="activeModelConfig"
            :studio-pane-is-hidden="studioPaneIsHidden"
            :vendor-configs="ASSISTANT_VENDOR_CONFIGS"
            :vendor-id="vendorId"
            @vendor-change="handleVendorChange"
        />
    </div>
</template>
