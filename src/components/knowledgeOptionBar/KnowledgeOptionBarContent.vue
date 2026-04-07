<script setup lang="ts">
// External Dependencies
import { MessageCircleMoreIcon, SearchIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import HomeIcon from '@/components/icon/HomeIcon.vue';
import Separator from '@/components/separator/Separator.vue';

// Properties & Emits
const emit = defineEmits<{ (event: 'continue'): void }>();

// State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();
const router = useRouter();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleOptionClick(knowledgePanelId: string): void {
    router.push({ path: route.path, query: { ...route.query, kView: knowledgePanelId } });
    emit('continue');
}
</script>

<template>
    <div class="bg-backdrop border-boundary h-full w-16.25 flex-col border-l pt-[calc(env(safe-area-inset-top)+55px)]">
        <!-- Separator -->
        <Separator class="mx-3" />

        <!-- Options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none pt-2 pb-6">
            <Button variant="iconLarge" @click="handleOptionClick('about')">
                <HomeIcon aria-hidden="true" class="[&>path]:stroke-[1.25]" />
            </Button>

            <Button variant="iconLarge" @click="handleOptionClick('library')">
                <SearchIcon aria-hidden="true" :stroke-width="1.25" />
            </Button>

            <Button variant="iconLarge" @click="handleOptionClick('chat')">
                <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
            </Button>
        </div>
    </div>
</template>
