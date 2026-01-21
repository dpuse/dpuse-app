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

        <div class="flex h-full flex-1 flex-col px-4">
            <div class="bg-muted flex-1"></div>

            <div class="rounded-md border">
                <Textarea
                    class="placeholder:text-muted-foreground max-h-48 w-full resize-none overflow-y-auto border-0 bg-transparent px-2 text-base! shadow-none ring-0 outline-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                    rows="1"
                    placeholder="Ask a question or search…"
                />

                <div class="flex justify-end pr-1 pb-1">
                    <Button size="icon-sm" variant="ghost">
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
