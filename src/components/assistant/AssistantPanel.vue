<script setup lang="ts">
import { ref } from 'vue';

type Properties = { isOpen: boolean };
const { isOpen } = defineProps<Properties>();

import { ArrowLeftFromLine } from 'lucide-vue-next';
import { ArrowRightToLine } from 'lucide-vue-next';

import AssistantChatPanel from '@/components/assistant/AssistantChatPanel.vue';
import AssistantLibraryPanel from '@/components/assistant/AssistantLibraryPanel.vue';
import AssistantIndexPanel from '@/components/assistant/AssistantIndexPanel.vue';
import Button from '@/components/ui/button/Button.vue';

type AssistantTabId = 'chat' | 'library' | 'index';
const tabConfigs: Array<{ id: AssistantTabId; label: string }> = [
    { id: 'chat', label: 'Chat' },
    { id: 'library', label: 'Library' },
    { id: 'index', label: 'Index' }
];
const activeTab = ref<AssistantTabId>('chat');

const isWide = ref(false);
</script>

<template>
    <div
        class="hidden flex-col overflow-hidden transition-[width,opacity] duration-300 md:flex"
        :class="isOpen ? ['border-l-0', isWide ? 'w-[65ch]' : 'w-[36ch]'] : ['w-0', 'border-l-0', 'border-transparent', 'pointer-events-none', 'opacity-0']"
    >
        <div class="flex h-14 flex-none px-4">
            <div class="flex w-full border-b pr-10">
                <div class="flex h-full flex-1 items-end justify-start gap-2">
                    <button
                        v-for="tabConfig in tabConfigs"
                        :key="tabConfig.id"
                        type="button"
                        class="flex min-w-12 justify-center border-b-2 border-transparent py-1 text-sm font-medium transition-colors"
                        :class="activeTab === tabConfig.id ? 'cursor-default border-b-gray-900 text-gray-900' : 'cursor-pointer text-gray-500 hover:text-gray-700'"
                        @click="activeTab = tabConfig.id"
                    >
                        {{ tabConfig.label }}
                    </button>
                </div>

                <Button
                    :aria-label="isWide ? 'Set assistant panel to compact width' : 'Set assistant panel to wide width'"
                    class="mt-2 flex-none cursor-pointer items-center justify-center rounded-full"
                    size="icon-lg"
                    variant="ghost"
                    @click="isWide = !isWide"
                >
                    <ArrowRightToLine v-if="isWide" class="size-5" :stroke-width="1.25" />
                    <ArrowLeftFromLine v-else class="size-5" :stroke-width="1.25" />
                </Button>
            </div>
        </div>

        <div class="flex-1">
            <AssistantChatPanel v-if="activeTab === 'chat'" />
            <AssistantLibraryPanel v-else-if="activeTab === 'library'" />
            <AssistantIndexPanel v-else />
        </div>
    </div>
</template>
