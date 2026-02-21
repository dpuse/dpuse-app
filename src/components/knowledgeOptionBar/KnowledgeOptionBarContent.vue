<script setup lang="ts">
// External dependencies
import { HomeIcon } from '@heroicons/vue/24/outline';
import { useRouter } from 'vue-router';
import { MessageCircleMoreIcon, SearchIcon } from 'lucide-vue-next';

// App components
import IconActionContent from '@/components/action/IconActionContent.vue';

// Properties
const properties = defineProps<{ sessionIsAuthenticated?: boolean; onSelect: () => void }>();

// Global state
const router = useRouter();

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleNavigateTo(view: string): void {
    router.push({ path: router.currentRoute.value.path, query: { ...router.currentRoute.value.query, knowledge: view } });
    properties.onSelect();
}
</script>

<template>
    <div class="bg-backdrop border-separator h-full w-16 flex-col border-l pt-13.75">
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px" />

        <!-- Options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none px-3 pt-2 pb-6">
            <button class="group outline-none" @click="handleNavigateTo('welcome')">
                <IconActionContent>
                    <HomeIcon aria-hidden="true" class="&>path]:stroke-[1.25]" />
                </IconActionContent>
            </button>

            <button class="group outline-none" @click="handleNavigateTo('search')">
                <IconActionContent>
                    <SearchIcon aria-hidden="true" :stroke-width="1.25" />
                </IconActionContent>
            </button>

            <button class="group outline-none" @click="handleNavigateTo('chat')">
                <IconActionContent>
                    <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
                </IconActionContent>
            </button>
        </div>
    </div>
</template>
