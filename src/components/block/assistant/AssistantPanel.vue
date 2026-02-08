<script setup lang="ts">
// Vendor dependencies
import { ref } from 'vue';

// Workbench components
import AssistantPanelContent from './AssistantPanelContent.vue';

// Properties
const properties = withDefaults(defineProps<{ isOpen: boolean; isFloatingOpen?: boolean }>(), { isFloatingOpen: false });

// Emits
const emit = defineEmits<{ (event: 'request-close'): void }>();

// ...
const isPanelWide = ref(false);

//
function handleTogglePanelWidth() {
    isPanelWide.value = !isPanelWide.value;
}

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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
</script>

<template>
    <div
        class="hidden flex-col transition-[width,opacity] duration-300 md:flex"
        :class="properties.isOpen ? ['border-l-0', isPanelWide ? 'w-150' : 'w-100'] : ['w-0', 'border-l-0', 'border-transparent', 'pointer-events-none', 'opacity-0']"
    >
        <AssistantPanelContent :messages="messages" :on-run-test="runTest" :is-panel-wide="isPanelWide" :on-toggle-panel-width="handleTogglePanelWidth" />
    </div>

    <Transition name="assistant-overlay" appear>
        <div v-if="properties.isFloatingOpen" class="fixed inset-0 z-40 flex md:hidden">
            <div class="bg-background-primary/70 absolute inset-0" @click="requestClose"></div>

            <dialog
                class="dpu-assistant-panel bg-background-secondary border-separator relative ml-auto flex h-full w-full max-w-100 flex-col border-l shadow-xl"
                open
                @cancel.prevent="requestClose"
            >
                <AssistantPanelContent :messages="messages" :on-run-test="runTest" :on-request-close="requestClose" />
            </dialog>
        </div>
    </Transition>
</template>

<style scoped>
.assistant-overlay-enter-active,
.assistant-overlay-leave-active {
    transition: opacity 220ms ease-in-out;
}
.assistant-overlay-enter-from,
.assistant-overlay-leave-to {
    opacity: 0;
}
.assistant-overlay-enter-active .dpu-assistant-panel,
.assistant-overlay-leave-active .dpu-assistant-panel {
    transition: transform 260ms ease-in-out;
}
.assistant-overlay-enter-from .dpu-assistant-panel,
.assistant-overlay-leave-to .dpu-assistant-panel {
    transform: translateX(100%);
}
</style>
