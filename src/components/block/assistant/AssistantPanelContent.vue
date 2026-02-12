<script setup lang="ts">
// External dependencies
import { ArrowBigLeftDashIcon, MessageCircleMoreIcon, SearchIcon, XIcon } from 'lucide-vue-next';

// Workbench components
import AssistantIcon from '@/components/icon/AssistantIcon.vue';
import Header from '@/components/block/header/Header.vue';
import IconActionContent from '@/components/base/IconActionContent.vue';

// Properties
type AssistantMessage = { id: number; text: string };
type Properties = {
    messages: AssistantMessage[];
    onRunTest: () => void;
    isPanelWide?: boolean;
    isWideDisplay: boolean;
    onTogglePanelWidth?: () => void;
    onRequestClose?: () => void;
};
defineProps<Properties>();
</script>

<template>
    <div class="flex h-full flex-1 flex-col">
        <div class="flex h-14 flex-none px-4">
            <div :class="['border-separator flex w-full items-center gap-x-2 border-b', onTogglePanelWidth ? 'pr-10' : '']">
                <AssistantIcon v-if="!isWideDisplay" class="size-6" :stroke-width="1.25" />

                <Header :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]" title="Assistant" :is-assist-panel-open-in-wide-display="false" :is-wide-display="isWideDisplay" />
                <!--
                <div class="flex items-center gap-x-2">
                    <IconActionContent
                        v-if="onTogglePanelWidth"
                        :aria-label="isPanelWide ? 'Set assistant panel to compact width' : 'Set assistant panel to wide width'"
                        class="flex-none cursor-pointer items-center justify-center rounded-full"
                        size="icon-lg"
                        variant="ghost"
                        @click="onTogglePanelWidth?.()"
                    >
                        <ArrowBigLeftDashIcon class="dpu-panel-width-icon size-6" :class="{ 'dpu-panel-width-icon-rotated': isPanelWide }" :stroke-width="1.25" />
                    </IconActionContent>

                    <IconActionContent
                        v-if="onRequestClose"
                        aria-label="Close assistant panel"
                        class="flex-none cursor-pointer items-center justify-center rounded-full"
                        size="icon-lg"
                        variant="ghost"
                        @click="onRequestClose?.()"
                    >
                        <XIcon class="size-5" :stroke-width="1.25" />
                    </IconActionContent>
                </div> -->
            </div>
        </div>

        <div class="flex flex-1 flex-col overflow-y-hidden px-4">
            <div class="text-muted-foreground flex flex-1 flex-col gap-y-4 overflow-y-auto py-4 font-light wrap-break-word">
                <div v-for="message of messages" :key="message.id">
                    {{ message.text }}
                </div>
            </div>

            <div class="flex-none">
                <!-- <Textarea
                    id="assistant-input"
                    name="assistant-input"
                    class="placeholder:text-muted-foreground max-h-48 w-full resize-none overflow-y-auto border-0 bg-transparent px-2 text-base! shadow-none ring-0 outline-none placeholder:text-sm focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                    rows="1"
                    placeholder="Ask a question → X to chat with assistant or;&#10;enter keywords → X to search the library…"
                /> -->
                <div>
                    <!-- <label for="comment" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Add your comment</label> -->
                    <div class="mt-2">
                        <textarea
                            id="comment"
                            name="comment"
                            class="bg-background-primary block max-h-48 w-full resize-none rounded-md border-0 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
                            rows="4"
                        />
                    </div>
                </div>

                <div class="flex justify-end pr-1 pb-1">
                    <IconActionContent size="icon-sm" variant="ghost" @click="onRunTest">
                        <MessageCircleMoreIcon class="size-5" stroke-width="1.25" />
                    </IconActionContent>
                    <IconActionContent size="icon-sm" variant="ghost">
                        <SearchIcon class="size-5" stroke-width="1.25" />
                    </IconActionContent>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* .dpu-panel-width-icon {
    transition: transform 220ms ease-in-out;
    transform-origin: center;
}

.dpu-panel-width-icon-rotated {
    transform: rotate(180deg);
} */
</style>
