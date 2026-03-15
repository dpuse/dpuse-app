<script setup lang="ts">
// External Dependencies
import { useRouter } from 'vue-router';
import { MessageCircleMoreIcon, SearchIcon } from 'lucide-vue-next';

// App Components - Statically imported so always available, even after app goes offline.
import Button from '@/components/button/Button.vue';
import HomeIcon from '@/components/icon/HomeIcon.vue';
import Separator from '@/components/separator/Separator.vue';

// Properties & Emits
const emit = defineEmits<{ (event: 'continue'): void }>();

// External State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const router = useRouter();

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleOptionClick(view: string): void {
    router.push({ path: router.currentRoute.value.path, query: { ...router.currentRoute.value.query, knowledge: view } });
    emit('continue');
}
</script>

<template>
    <div class="bg-backdrop border-boundary h-full w-16.25 flex-col border-l pt-13.75">
        <!-- Separator -->
        <Separator class="mx-3" />

        <!-- Options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none pt-2 pb-6">
            <Button variant="iconLarge" @click="handleOptionClick('welcome')">
                <HomeIcon aria-hidden="true" class="[&>path]:stroke-[1.25]" />
            </Button>

            <Button variant="iconLarge" @click="handleOptionClick('search')">
                <SearchIcon aria-hidden="true" :stroke-width="1.25" />
            </Button>

            <Button variant="iconLarge" @click="handleOptionClick('chat')">
                <MessageCircleMoreIcon aria-hidden="true" :stroke-width="1.25" />
            </Button>
        </div>
    </div>
</template>
