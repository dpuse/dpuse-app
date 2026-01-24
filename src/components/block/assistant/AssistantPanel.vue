<script setup lang="ts">
// External dependencies
import { type HTMLAttributes, ref } from 'vue';

// Properties
type Properties = { class?: HTMLAttributes['class']; isOpen: boolean; isFloatingOpen?: boolean };
const properties = withDefaults(defineProps<Properties>(), { isFloatingOpen: false });

// Emits
const emit = defineEmits<{ (event: 'request-close'): void }>();

// Components and icons
import AssistantPanelContent from './AssistantPanelContent.vue';
import Button from '@/components/base/button/Button.vue';
import { ArrowLeftFromLine, ArrowRightToLine, X } from 'lucide-vue-next';

// Panel width state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isPanelWide = ref(false);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const messages = ref<{ id: number; text: string }[]>([]);

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
        :class="properties.isOpen ? ['border-l-0', isPanelWide ? 'w-[65ch]' : 'w-[36ch]'] : ['w-0', 'border-l-0', 'border-transparent', 'pointer-events-none', 'opacity-0']"
    >
        <div class="flex h-14 flex-none px-4">
            <div class="flex w-full items-center border-b pr-10">
                <div class="flex h-full flex-1 items-center text-lg font-light">Assistant</div>

                <Button
                    :aria-label="isPanelWide ? 'Set assistant panel to compact width' : 'Set assistant panel to wide width'"
                    class="flex-none cursor-pointer items-center justify-center rounded-full"
                    size="icon-lg"
                    variant="ghost"
                    @click="isPanelWide = !isPanelWide"
                >
                    <ArrowRightToLine v-if="isPanelWide" class="size-6" :stroke-width="1.25" />
                    <ArrowLeftFromLine v-else class="size-6" :stroke-width="1.25" />
                </Button>
            </div>
        </div>

        <AssistantPanelContent :messages="messages" :on-run-test="runTest" />
    </div>

    <Transition name="assistant-overlay" appear>
        <div v-if="properties.isFloatingOpen" class="assistant-overlay fixed inset-0 z-40 flex md:hidden">
            <div class="bg-background/70 absolute inset-0 backdrop-blur-sm" @click="emit('request-close')"></div>

            <div class="dpu-assistant-panel bg-background relative ml-auto flex h-full w-full max-w-[26rem] flex-col shadow-2xl" role="dialog" aria-modal="true">
                <div class="flex h-14 flex-none items-center border-b px-4">
                    <div class="flex h-full flex-1 items-center text-lg font-light">Assistant</div>

                    <Button
                        aria-label="Close assistant panel"
                        class="flex-none cursor-pointer items-center justify-center rounded-full"
                        size="icon-lg"
                        variant="ghost"
                        @click="emit('request-close')"
                    >
                        <X class="size-5" :stroke-width="1.25" />
                    </Button>
                </div>

                <AssistantPanelContent :messages="messages" :on-run-test="runTest" />
            </div>
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
