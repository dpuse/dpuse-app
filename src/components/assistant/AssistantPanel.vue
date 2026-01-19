<script setup lang="ts">
import { ref } from 'vue';

type Properties = { isOpen: boolean };
const { isOpen } = defineProps<Properties>();

type AssistantTabId = 'chat' | 'library' | 'index';
const tabs: Array<{ id: AssistantTabId; label: string }> = [
    { id: 'chat', label: 'Chat' },
    { id: 'library', label: 'Library' },
    { id: 'index', label: 'Index' }
];
const activeTab = ref<AssistantTabId>('chat');

const isWide = ref(false);
</script>

<template>
    <div
        class="hidden flex-col overflow-hidden bg-[#fdfdfd] transition-[width,opacity] duration-300 md:flex"
        :class="isOpen ? ['border-default', 'border-l', isWide ? 'w-[65ch]' : 'w-[36ch]'] : ['w-0', 'border-l-0', 'border-transparent', 'pointer-events-none', 'opacity-0']"
    >
        <div class="flex h-14 flex-none flex-col">
            <div class="flex flex-1 items-center gap-2 pr-12 pl-2 text-sm">
                <UButton
                    :aria-label="isWide ? 'Set assistant panel to compact width' : 'Set assistant panel to wide width'"
                    class="h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-full p-0"
                    color="neutral"
                    :icon="isWide ? 'i-heroicons-chevron-double-right' : 'i-heroicons-chevron-double-left'"
                    variant="ghost"
                    @click="isWide = !isWide"
                />

                <div class="flex h-full flex-1">
                    <button
                        v-for="tab in tabs"
                        :key="tab.id"
                        type="button"
                        class="flex flex-1 items-center justify-center border-t-2 border-b-2 border-transparent text-sm font-medium transition-colors"
                        :class="activeTab === tab.id ? 'cursor-default border-b-gray-900 text-gray-900' : 'cursor-pointer text-gray-500 hover:text-gray-700'"
                        @click="activeTab = tab.id"
                    >
                        {{ tab.label }}
                    </button>
                </div>
            </div>
            <USeparator class="flex-none px-2" />
        </div>

        <div class="flex-1">
            <AssistantChatPanel v-if="activeTab === 'chat'" />
            <AssistantLibraryPanel v-else-if="activeTab === 'library'" />
            <AssistantIndexPanel v-else />
        </div>
    </div>
</template>
