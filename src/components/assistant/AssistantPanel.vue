<script setup lang="ts">
import { ref } from 'vue';

type Properties = { isOpen: boolean };
const { isOpen } = defineProps<Properties>();

import { ArrowLeftFromLine } from 'lucide-vue-next';
import { ArrowRightToLine } from 'lucide-vue-next';
import { Search } from 'lucide-vue-next';
import { MessageCircleMore } from 'lucide-vue-next';

import Button from '@/components/ui/button/Button.vue';
import { Textarea } from '@/components/ui/textarea';

const isWide = ref(false);

const messages = ref<{ id: number; text: string }[]>([]);
function runTest() {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    const raw = JSON.stringify({
        message: 'Can I show the current state of all modules?'
    });

    const requestOptions: RequestInit = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };

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
        class="mb-5.5 hidden flex-col overflow-hidden transition-[width,opacity] duration-300 md:flex"
        :class="isOpen ? ['border-l-0', isWide ? 'w-[65ch]' : 'w-[36ch]'] : ['w-0', 'border-l-0', 'border-transparent', 'pointer-events-none', 'opacity-0']"
    >
        <div class="flex h-14 flex-none px-4">
            <div class="flex w-full items-center border-b pr-10">
                <div class="flex h-full flex-1 items-center text-lg font-light">Assistant</div>

                <Button
                    :aria-label="isWide ? 'Set assistant panel to compact width' : 'Set assistant panel to wide width'"
                    class="flex-none cursor-pointer items-center justify-center rounded-full"
                    size="icon-lg"
                    variant="ghost"
                    @click="isWide = !isWide"
                >
                    <ArrowRightToLine v-if="isWide" class="size-5" :stroke-width="1.25" />
                    <ArrowLeftFromLine v-else class="size-5" :stroke-width="1.25" />
                </Button>
            </div>
        </div>

        <div class="flex h-full flex-1 flex-col overflow-y-hidden px-4">
            <div class="text-muted-foreground flex flex-1 flex-col gap-y-4 overflow-y-auto py-4 font-light wrap-break-word">
                <div v-for="message of messages" :key="message.id">
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
                    <Button size="icon-sm" variant="ghost" @click="runTest">
                        <MessageCircleMore class="size-5" stroke-width="1.25" />
                    </Button>
                    <Button size="icon-sm" variant="ghost">
                        <Search class="size-5" stroke-width="1.25" />
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
