<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { MessageCircleMore } from 'lucide-vue-next';

import Button from '@/components/ui/button/Button.vue';

import { Textarea } from '@/components/ui/textarea';
</script>

<template>
    <div class="flex h-full flex-col gap-y-2 px-4 pt-3">
        <div class="bg-muted flex-1 rounded-md"></div>

        <div class="rounded-md border">
            <Textarea
                class="text-foreground placeholder:text-muted-foreground max-h-48 w-full resize-none overflow-y-auto border-0 bg-transparent px-2 text-sm shadow-none ring-0 outline-none focus-visible:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
                rows="1"
                placeholder="Ask a question or search…"
            />

            <div class="flex justify-end pr-1 pb-1">
                <Button size="icon-sm" variant="ghost">
                    <MessageCircleMore stroke-width="1.25" />
                </Button>
                <Button size="icon-sm" variant="ghost">
                    <Search stroke-width="1.25" />
                </Button>
            </div>
        </div>
    </div>
</template>
