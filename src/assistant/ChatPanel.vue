<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowUpIcon } from '@lucide/vue';
import DOMPurify from 'dompurify';
import { defineAsyncComponent, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';

// ── DPUse Framework
import type { MarkedTool as MarkedToolType } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import { toolConfigs } from '@/state/session';
import { type AssistantChatMessage, getMessageSteps } from './assistantChat';
import type { AssistantModelConfig, AssistantVendorConfig, AssistantVendorId } from './modelConfigs';

// ── Local Components - Static
import AssistantVendorMenu from './AssistantVendorMenu.vue';
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/ScrollArea2.vue';

// ── Local Components - Dynamic
const ChatSessionTanstack = defineAsyncComponent(() => import('./ChatSessionTanstack.vue'));
const ChatSessionVercel = defineAsyncComponent(() => import('./ChatSessionVercel.vue'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PROMPT = 'What should I search for to find the latest developments in renewable energy?';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { modelConfig, vendorConfigs, vendorId } = defineProps<{
    modelConfig: AssistantModelConfig;
    vendorConfigs: AssistantVendorConfig[];
    vendorId: AssistantVendorId;
}>();

const emit = defineEmits<{ statusChange: [status: string]; vendorChange: [vendorId: AssistantVendorId, modelConfig: AssistantModelConfig] }>();

// A vendor change always remounts this panel (see AssistantLayout's :key), so the choice here is fixed for the panel's lifetime.
const SessionComponent = vendorId === 'tanstack' ? ChatSessionTanstack : ChatSessionVercel;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const input = ref(PROMPT);
const scrollElement = ref<HTMLElement | null>(null);
const messages = ref<AssistantChatMessage[]>([]);
const status = ref('idle');
const markedTool = shallowRef<MarkedToolType>();

const sessionReference = useTemplateRef<{ sendMessage: (text: string) => Promise<void> }>('sessionReference');

const state: { scrollObserver: MutationObserver | null } = { scrollObserver: null };

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

function renderText(text: string): string {
    if (!markedTool.value) return '';
    return DOMPurify.sanitize(markedTool.value.render(text));
}

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

const toolReady = new Promise<void>((resolve) => {
    watch(
        toolConfigs,
        (newToolConfigs) => {
            if (newToolConfigs.length === 0) return;
            resolve();
        },
        { immediate: true }
    );
});

onMounted(async () => {
    await toolReady;
    markedTool.value = await loadMarkedTool();
});

onUnmounted(() => state.scrollObserver?.disconnect());

watch(status, (newStatus) => emit('statusChange', newStatus), { immediate: true });

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectVendor(newVendorId: AssistantVendorId, newModelConfig: AssistantModelConfig): void {
    emit('vendorChange', newVendorId, newModelConfig);
}

async function handleSendMessage(): Promise<void> {
    const text = input.value.trim();
    if (!text || sessionReference.value == null) return;
    input.value = '';
    await sessionReference.value.sendMessage(text);
}

function handleScrollAreaInitialised(element: HTMLElement): void {
    scrollElement.value = element;
    state.scrollObserver = new MutationObserver(() => {
        element.scrollTop = element.scrollHeight;
    });
    state.scrollObserver.observe(element, { childList: true, subtree: true, characterData: true });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function loadMarkedTool(): Promise<MarkedToolType> {
    const toolModuleConfig = toolConfigs.value.find((config) => config.id === 'dpuse-tool-marked-markdown-parser');
    if (!toolModuleConfig) throw new Error('No Marked tool module configuration.');

    const url = `https://engine-eu.dpuse.app/tools/marked-markdown-parser_v${toolModuleConfig.version}/dpuse-tool-marked-markdown-parser.es.js`;
    const module = (await import(/* @vite-ignore */ url)) as { MarkedTool: new () => MarkedToolType };
    const MarkedTool = module.MarkedTool;
    return new MarkedTool();
}
</script>

<template>
    <div class="relative flex min-h-0 flex-1 flex-col pl-4">
        <component :is="SessionComponent" ref="sessionReference" :model-config="modelConfig" @messages-change="messages = $event" @status-change="status = $event" />

        <ScrollArea class="flex flex-1 flex-col" scroll-area-padding="embedded" @initialised="handleScrollAreaInitialised">
            <template v-for="message in messages" :key="message.id">
                <template v-if="message.role === 'user'">
                    <div v-for="part in message.parts.filter((part) => part.type === 'text')" :key="part.content" class="mt-3 flex pr-4">
                        <div class="w-full rounded-md bg-blue-50 px-3 py-2 text-sm">{{ part.content }}</div>
                    </div>

                    <div v-for="(errorText, errorIndex) in message.errors" :key="`${message.id}-error-${errorIndex}`" class="mt-3 pr-4">
                        <div class="flex gap-3">
                            <div class="flex w-4 shrink-0 flex-col items-center">
                                <div class="mt-1.25 size-2 shrink-0 rounded-full bg-rose-600"></div>
                            </div>
                            <div class="min-w-0 flex-1 pb-4">
                                <div class="mb-1 text-xs font-medium tracking-wide text-rose-700">Error</div>
                                <div class="text-sm whitespace-pre-line text-rose-700">{{ errorText }}</div>
                            </div>
                        </div>
                    </div>
                </template>

                <template v-else-if="message.role === 'assistant'">
                    <div class="mt-3 pr-4">
                        <div v-for="step in getMessageSteps(message)" :key="step.type" class="flex gap-3">
                            <div class="flex w-4 shrink-0 flex-col items-center">
                                <div class="mt-1.25 size-2 shrink-0 rounded-full" :class="step.type === 'thinking' ? 'bg-subtle' : 'bg-content'"></div>
                                <div v-if="!step.isLast" class="mt-1 w-px flex-1 bg-separator"></div>
                            </div>
                            <div class="min-w-0 flex-1 pb-4">
                                <template v-if="step.type === 'thinking'">
                                    <div class="mb-1 text-xs font-medium tracking-wide text-subtle">Thinking</div>
                                    <div v-for="part in step.parts" :key="part.content" class="text-sm text-subtle">{{ part.content }}</div>
                                </template>
                                <template v-else>
                                    <div class="mb-1 text-xs font-medium tracking-wide text-subtle">Response</div>
                                    <div v-for="part in step.parts" :key="part.content" class="text-sm" v-html="renderText(part.content)" />
                                </template>
                            </div>
                        </div>
                    </div>
                </template>
            </template>
        </ScrollArea>

        <!-- Input - in-flow, always rounded, with an action bar (vendor/model, status, send) attached below the text box. -->
        <div class="my-3 mr-4 flex flex-none flex-col border-y border-separator">
            <textarea
                id="comment"
                v-model="input"
                name="comment"
                class="field-sizing-content max-h-40 min-h-11 w-full resize-none px-3.5 pt-3 text-sm text-muted outline-none"
                @keydown.enter.exact.prevent="handleSendMessage"
            />

            <div class="flex items-center justify-between gap-x-2 px-2 pb-2">
                <AssistantVendorMenu :model-config="modelConfig" :vendor-configs="vendorConfigs" :vendor-id="vendorId" @select="handleSelectVendor" />

                <div class="flex items-center gap-x-2">
                    <span class="text-xs text-muted">{{ status }}</span>
                    <Button class="rounded-full bg-blue-400 p-1 text-white disabled:opacity-40" shape="minimal" :disabled="input.trim().length === 0" @click="handleSendMessage">
                        <ArrowUpIcon class="size-5.5" stroke-width="2.5" />
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
:deep(h2) {
    font-weight: 500;
    margin-top: 12px;
}
:deep(ul) {
    list-style-type: disc;
    margin-top: 4px;
    margin-bottom: 4px;
    padding-left: 20px;
}
:deep(ol) {
    list-style-type: decimal;
    margin-top: 4px;
    margin-bottom: 4px;
    padding-left: 20px;
}
:deep(li) {
    margin-top: 2px;
    margin-bottom: 2px;
}
:deep(p) {
    margin-top: 12px;
}
:deep(strong) {
    font-weight: 500;
}
:deep(table) {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
    margin-bottom: 12px;
    font-size: 0.8125rem;
}
:deep(th) {
    text-align: left;
    font-weight: 500;
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-separator);
    white-space: nowrap;
}
:deep(td) {
    padding: 6px 10px;
    border-bottom: 1px solid var(--color-separator);
    vertical-align: top;
}
:deep(tr:last-child td) {
    border-bottom: none;
}
</style>
