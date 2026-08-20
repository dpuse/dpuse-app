<script setup lang="ts">
// ── External Dependencies & Registrations
import { BookSearchIcon, InfoIcon, MessageCircleMoreIcon } from '@lucide/vue';
import { type Component, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import type { AssistantViewId } from './assistantViews';

// ── Local Components - Static
import AssistantHeader from './AssistantHeader.vue';
import Button from '@/components/ui/button/Button.vue';
import Separator from '@/components/ui/Separator.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The assistant's 3 views, always shown together so any one is reachable from any other.
// 'chat' can run on either the Tanstack or Vercel AI SDK — swap vendor via the model selector in the chat input.
const ASSISTANT_TABS: { id: AssistantViewId; icon: Component; label: string }[] = [
    { id: 'about', icon: InfoIcon, label: 'About' },
    { id: 'chat', icon: MessageCircleMoreIcon, label: 'Chat' },
    { id: 'knowledgeBase', icon: BookSearchIcon, label: 'Library' }
];

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeViewId = computed<AssistantViewId>(() => (route.query.aView as AssistantViewId | undefined) ?? 'about');

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectView(viewId: AssistantViewId): void {
    if (activeViewId.value === viewId) return;
    router.replace({ query: { ...route.query, aView: viewId } });
}
</script>

<template>
    <AssistantHeader class="mx-4 flex-none" :title="title" />

    <nav class="mx-4 flex flex-none items-center gap-x-4 overflow-x-auto" aria-label="Assistant view" data-region="AssistantPanelHeaderTabs">
        <Button
            class="flex flex-none items-center gap-x-1.5 border-y-2 border-t-transparent py-1.25"
            :class="activeViewId === ASSISTANT_TABS[1].id ? 'border-b-accent text-accent' : 'border-b-transparent text-muted'"
            shape="minimal"
            @click="handleSelectView(ASSISTANT_TABS[1].id)"
        >
            <component :is="ASSISTANT_TABS[1].icon" aria-hidden="true" class="size-5" :stroke-width="2" />
            {{ ASSISTANT_TABS[1].label }}
        </Button>
        <Button
            class="flex flex-none items-center gap-x-1.5 border-y-2 border-t-transparent py-1.25"
            :class="activeViewId === ASSISTANT_TABS[2].id ? 'border-b-accent text-accent' : 'border-b-transparent text-muted'"
            shape="minimal"
            @click="handleSelectView(ASSISTANT_TABS[2].id)"
        >
            <component :is="ASSISTANT_TABS[2].icon" aria-hidden="true" class="size-5" :stroke-width="2" />
            {{ ASSISTANT_TABS[2].label }}
        </Button>
        <Button
            class="ml-auto flex flex-none items-center gap-x-1.5 border-y-2 border-t-transparent py-1.25 text-subtle"
            :class="activeViewId === ASSISTANT_TABS[0].id ? 'border-b-accent text-accent' : 'border-b-transparent text-muted'"
            shape="minimal"
            @click="handleSelectView(ASSISTANT_TABS[0].id)"
        >
            <component :is="ASSISTANT_TABS[0].icon" aria-hidden="true" class="size-5" :stroke-width="2" />
            {{ ASSISTANT_TABS[0].label }}
        </Button>
    </nav>

    <Separator class="mx-4" />
</template>
