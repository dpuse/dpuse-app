<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';
import { SendHorizonalIcon } from 'lucide-vue-next';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import Header from '@/components/header/Header.vue';

// Properties & Emits
const { title, workbenchPaneIsHidden } = defineProps<{ title: string; workbenchPaneIsHidden: boolean }>();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Chat state (kept here so it persists across view switches)
const messages = ref<{ id: number; text: string }[]>([]);

function runTest(): void {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    const raw = JSON.stringify({ message: 'Can I show the current state of all modules?' });
    const requestOptions: RequestInit = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' };
    fetch('https://api.datapos.app/ai/chat', requestOptions)
        .then((response) => response.json())
        .then((result) => {
            const id = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0;
            messages.value.push({ id, text: JSON.stringify(result) });
        })
        .catch((error) => console.log('error', error));
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
</script>

<template>
    <div>
        <Header :breadcrumbs="[{ id: 'knowledge', label: 'Knowledge' }]" :title="title" :workbench-pane-is-hidden="workbenchPaneIsHidden" />

        <div class="flex flex-1 flex-col overflow-y-hidden p-4">
            <div class="text-muted-foreground flex flex-1 flex-col gap-y-4 overflow-y-auto pb-4 font-light wrap-break-word">
                <div v-for="message of messages" :key="message.id">
                    {{ message.text }}
                </div>
            </div>

            <div class="flex-none pb-6">
                <div>
                    <label for="comment" class="block text-sm/6 font-medium text-gray-900 dark:text-white">A label...</label>
                    <div class="mt-2">
                        <textarea
                            id="comment"
                            name="comment"
                            class="bg-surface block max-h-48 w-full resize-none overflow-y-auto rounded-md border-0 px-3 py-1.5 text-base outline-1 -outline-offset-1 outline-gray-300 placeholder:text-sm placeholder:text-gray-400 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus-visible:outline-indigo-500"
                            rows="1"
                            placeholder="Ask a question…"
                        />
                    </div>
                </div>

                <div class="flex justify-end pr-1 pb-1">
                    <Button icon-size="sm" @click="runTest">
                        <SendHorizonalIcon stroke-width="1.25" />
                    </Button>
                </div>
            </div>
        </div>
    </div>
</template>
