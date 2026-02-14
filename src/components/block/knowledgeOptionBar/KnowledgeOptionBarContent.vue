<script setup lang="ts">
// External dependencies
import { HomeIcon } from '@heroicons/vue/24/outline';
import { MessageCircleMoreIcon, SearchIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// Workbench components
import IconActionContent from '@/components/base/IconActionContent.vue';

// Properties
const properties = defineProps<{ sessionIsAuthenticated?: boolean; onSelect: () => void }>();

// Navigation
const route = useRoute();
const router = useRouter();

function navigateKnowledge(view: string): void {
    router.push({ path: route.path, query: { ...route.query, knowledge: view } });
    properties.onSelect();
}
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Separator -->
        <div class="bg-separator mx-3 h-px" />

        <!-- Benchtop options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none px-3 pt-2 pb-6">
            <div class="flex w-full flex-1 flex-col items-center gap-y-2">
                <button class="group outline-none" @click="navigateKnowledge('welcome')">
                    <IconActionContent>
                        <HomeIcon aria-hidden="true" class="size-6" :stroke-width="1.25" />
                    </IconActionContent>
                </button>

                <button class="group outline-none" @click="navigateKnowledge('search')">
                    <IconActionContent>
                        <SearchIcon aria-hidden="true" class="size-6" :stroke-width="1.25" />
                    </IconActionContent>
                </button>

                <button class="group outline-none" @click="navigateKnowledge('chat')">
                    <IconActionContent>
                        <MessageCircleMoreIcon aria-hidden="true" class="size-5.5" :stroke-width="1.25" />
                    </IconActionContent>
                </button>
            </div>
        </div>
    </div>
</template>
