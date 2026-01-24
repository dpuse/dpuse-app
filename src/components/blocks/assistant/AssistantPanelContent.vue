<script setup lang="ts">
import Button from '@/components/primitives/button/Button.vue';
import { Textarea } from '~/src/components/primitives/textarea';
import { MessageCircleMore, Search } from 'lucide-vue-next';

type AssistantMessage = { id: number; text: string };

const props = defineProps<{ messages: AssistantMessage[]; onRunTest: () => void }>();
</script>

<template>
    <div class="flex h-full flex-1 flex-col overflow-y-hidden px-4">
        <div class="text-muted-foreground flex flex-1 flex-col gap-y-4 overflow-y-auto py-4 font-light wrap-break-word">
            <div v-for="message of props.messages" :key="message.id">
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
                <Button size="icon-sm" variant="ghost" @click="props.onRunTest">
                    <MessageCircleMore class="size-5" stroke-width="1.25" />
                </Button>
                <Button size="icon-sm" variant="ghost">
                    <Search class="size-5" stroke-width="1.25" />
                </Button>
            </div>
        </div>
    </div>
</template>
