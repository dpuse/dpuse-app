<script setup lang="ts">
// Components and icons
import Button from '@/components/base/button/Button.vue';
import { Textarea } from '@/components/base/textarea';
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
                    <Button
                        v-if="properties.onTogglePanelWidth"
                        :aria-label="properties.isPanelWide ? 'Set assistant panel to compact width' : 'Set assistant panel to wide width'"
                        class="flex-none cursor-pointer items-center justify-center rounded-full"
                        size="icon-lg"
                        variant="ghost"
                        @click="properties.onTogglePanelWidth?.()"
                    >
                        <ArrowBigLeftDashIcon class="dpu-panel-width-icon size-6" :class="{ 'dpu-panel-width-icon-rotated': properties.isPanelWide }" :stroke-width="1.25" />
                    </Button>

                    <Button
                        v-if="properties.onRequestClose"
                        aria-label="Close assistant panel"
                        class="flex-none cursor-pointer items-center justify-center rounded-full"
                        size="icon-lg"
                        variant="ghost"
                        @click="properties.onRequestClose?.()"
                    >
                        <XIcon class="size-5" :stroke-width="1.25" />
                    </Button>
                </div>
            </div>
        </div>

        <div class="mb-5.5 flex flex-1 flex-col overflow-y-hidden px-4">
            <div class="text-muted-foreground flex flex-1 flex-col gap-y-4 overflow-y-auto py-4 font-light wrap-break-word">
                <div v-for="message of properties.messages" :key="message.id">
                    {{ message.text }}
                </div>
            </div>

            <div class="flex-none rounded-md border">
                <Textarea
                    class="placeholder:text-muted-foreground max-h-48 w-full resize-none overflow-y-auto border-0 bg-transparent px-2 text-base! shadow-none ring-0 outline-none placeholder:text-sm focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                    rows="1"
                    placeholder="Ask a question → X to chat with assistant or;&#10;enter keywords → X to search the library…"
                />

                <div class="flex justify-end pr-1 pb-1">
                    <Button size="icon-sm" variant="ghost" @click="properties.onRunTest">
                        <MessageCircleMoreIcon class="size-5" stroke-width="1.25" />
                    </Button>
                    <Button size="icon-sm" variant="ghost">
                        <SearchIcon class="size-5" stroke-width="1.25" />
                    </Button>
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
