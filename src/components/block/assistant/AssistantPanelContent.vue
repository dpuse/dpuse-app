<script setup lang="ts">
// Components
import IconButton from '@/components/base/IconButton.vue';
import { ArrowBigLeftDashIcon, MessageCircleMoreIcon, SearchIcon, XIcon } from 'lucide-vue-next';

// Properties
type AssistantMessage = { id: number; text: string };
type Properties = { messages: AssistantMessage[]; onRunTest: () => void; isPanelWide?: boolean; onTogglePanelWidth?: () => void; onRequestClose?: () => void };
const properties = defineProps<Properties>();
</script>

<template>
    <div class="flex h-full flex-1 flex-col">
        <div class="flex h-14 flex-none px-4">
            <div :class="['flex w-full items-center border-b', properties.onTogglePanelWidth ? 'pr-10' : '']">
                <div class="flex h-full flex-1 items-center text-lg font-light">Assistant</div>

                <div class="flex items-center gap-x-2">
                    <IconButton
                        v-if="properties.onTogglePanelWidth"
                        :aria-label="properties.isPanelWide ? 'Set assistant panel to compact width' : 'Set assistant panel to wide width'"
                        class="flex-none cursor-pointer items-center justify-center rounded-full"
                        size="icon-lg"
                        variant="ghost"
                        @click="properties.onTogglePanelWidth?.()"
                    >
                        <ArrowBigLeftDashIcon class="dpu-panel-width-icon size-6" :class="{ 'dpu-panel-width-icon-rotated': properties.isPanelWide }" :stroke-width="1.25" />
                    </IconButton>

                    <IconButton
                        v-if="properties.onRequestClose"
                        aria-label="Close assistant panel"
                        class="flex-none cursor-pointer items-center justify-center rounded-full"
                        size="icon-lg"
                        variant="ghost"
                        @click="properties.onRequestClose?.()"
                    >
                        <XIcon class="size-5" :stroke-width="1.25" />
                    </IconButton>
                </div>
            </div>
        </div>

        <div class="mb-6 flex flex-1 flex-col overflow-y-hidden px-4">
            <div class="text-muted-foreground flex flex-1 flex-col gap-y-4 overflow-y-auto py-4 font-light wrap-break-word">
                <div v-for="message of properties.messages" :key="message.id">
                    {{ message.text }}
                </div>
            </div>

            <div class="flex-none rounded-md border">
                <!-- <Textarea
                    id="assistant-input"
                    name="assistant-input"
                    class="placeholder:text-muted-foreground max-h-48 w-full resize-none overflow-y-auto border-0 bg-transparent px-2 text-base! shadow-none ring-0 outline-none placeholder:text-sm focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                    rows="1"
                    placeholder="Ask a question → X to chat with assistant or;&#10;enter keywords → X to search the library…"
                /> -->
                <div>
                    <label for="comment" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Add your comment</label>
                    <div class="mt-2">
                        <textarea
                            rows="4"
                            name="comment"
                            id="comment"
                            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                        ></textarea>
                    </div>
                </div>

                <div class="flex justify-end pr-1 pb-1">
                    <IconButton size="icon-sm" variant="ghost" @click="properties.onRunTest">
                        <MessageCircleMoreIcon class="size-5" stroke-width="1.25" />
                    </IconButton>
                    <IconButton size="icon-sm" variant="ghost">
                        <SearchIcon class="size-5" stroke-width="1.25" />
                    </IconButton>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dpu-panel-width-icon {
    transition: transform 220ms ease-in-out;
    transform-origin: center;
}

.dpu-panel-width-icon-rotated {
    transform: rotate(180deg);
}
</style>
