<script setup lang="ts">
// External dependencies
import { type HTMLAttributes, ref } from 'vue';

// Components
import AssistantPanelContent from './AssistantPanelContent.vue';

// Properties
type Properties = { class?: HTMLAttributes['class']; isOpen: boolean; isFloatingOpen?: boolean };
const properties = withDefaults(defineProps<Properties>(), { isFloatingOpen: false });

// Emits
const emit = defineEmits<{ (event: 'request-close'): void }>();

// Panel width state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isPanelWide = ref(false);
const togglePanelWidth = () => {
    isPanelWide.value = !isPanelWide.value;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const messages = ref<{ id: number; text: string }[]>([]);
const requestClose = () => emit('request-close');

function runTest() {
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
</script>

<template>
    <div
        class="hidden flex-col overflow-hidden transition-[width,opacity] duration-300 md:flex"
        :class="properties.isOpen ? ['border-l-0', isPanelWide ? 'w-150' : 'w-100'] : ['w-0', 'border-l-0', 'border-transparent', 'pointer-events-none', 'opacity-0']"
    >
        <AssistantPanelContent :messages="messages" :on-run-test="runTest" :is-panel-wide="isPanelWide" :on-toggle-panel-width="togglePanelWidth" />
    </div>

    <Transition name="assistant-overlay" appear>
        <div v-if="properties.isFloatingOpen" class="assistant-overlay fixed inset-0 z-40 flex md:hidden">
            <div class="bg-background/70 absolute inset-0 backdrop-blur-sm" @click="requestClose"></div>

            <dialog class="dpu-assistant-panel bg-background relative ml-auto flex h-full w-full max-w-100 flex-col shadow-2xl" open @cancel.prevent="requestClose">
                <AssistantPanelContent :messages="messages" :on-run-test="runTest" :on-request-close="requestClose" />
            </dialog>
        </div>
    </Transition>
</template>

<style scoped>
.assistant-overlay-enter-active,
.assistant-overlay-leave-active {
    transition: opacity 220ms ease;
}

.assistant-overlay-enter-from,
.assistant-overlay-leave-to {
    opacity: 0;
}

.assistant-overlay-enter-active .dpu-assistant-panel,
.assistant-overlay-leave-active .dpu-assistant-panel {
    transition: transform 260ms ease;
}

.assistant-overlay-enter-from .dpu-assistant-panel,
.assistant-overlay-leave-to .dpu-assistant-panel {
    transform: translateX(100%);
}
</style>
