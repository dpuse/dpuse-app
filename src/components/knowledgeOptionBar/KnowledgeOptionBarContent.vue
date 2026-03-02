<script setup lang="ts">
// External dependencies
import { HomeIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';
import { MessageCircleMoreIcon, SearchIcon } from 'lucide-vue-next';

// App components
import ActionButton from '@/components/action/ActionButton.vue';
import Separator from '@/components/separator/Separator.vue';

// Properties
const properties = defineProps<{ sessionIsAuthenticated?: boolean; onSelect: () => void }>();

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const router = useRouter();

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleNavigateTo(view: string): void {
    router.push({ path: router.currentRoute.value.path, query: { ...router.currentRoute.value.query, knowledge: view } });
    properties.onSelect();
}
</script>

<template>
    <div class="bg-backdrop border-boundary h-full w-16.25 flex-col border-l pt-13.75">
        <!-- Separator -->
        <Separator class="mx-3" />

        <!-- Options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none pt-2 pb-6">
            <ActionButton variant="iconLarge" @click="handleNavigateTo('welcome')">
                <HomeIcon aria-hidden="true" class="[&>path]:stroke-[1.25]" />
            </ActionButton>

            <ActionButton variant="iconLarge" @click="handleNavigateTo('search')">
                <SearchIcon aria-hidden="true" :stroke-width="1.25" />
            </ActionButton>

            <ActionButton variant="iconLarge" @click="handleNavigateTo('chat')">
                <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
            </ActionButton>
        </div>
    </div>
</template>
