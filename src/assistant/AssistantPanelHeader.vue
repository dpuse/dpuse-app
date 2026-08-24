<script setup lang="ts">
// ── External Dependencies & Registrations
import { InfoIcon } from '@lucide/vue';
import { type Component, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { localiseConfigs } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import type { ConfigOptionConfig } from '@/utilities/index.ts';
import { localeId } from '@/state/locale.ts';

// ── Static Components
import AssistantHeader from './AssistantHeader.vue';
import TabBar from '@/components/ui/TabBar.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The assistant's 3 views, always shown together so any one is reachable from any other.
// 'chat' can run on either the Tanstack or Vercel AI SDK — swap vendor via the model selector in the chat input.
const ASSISTANT_TABS: ConfigOptionConfig<Component>[] = [
    { id: 'chat', label: { en: 'Chat' }, description: {}, icon: null, iconDark: null },
    { id: 'library', label: { en: 'Library' }, description: {}, icon: null, iconDark: null },
    { id: 'about', label: { en: '' }, description: {}, icon: InfoIcon, iconDark: null, rightAligned: true }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const activeViewId = computed(() => (typeof route.query.aView === 'string' ? route.query.aView : 'about'));
const configOptionLocalisedConfigs = computed(() => localiseConfigs<ConfigOptionConfig<Component>>(ASSISTANT_TABS, localeId.value));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectView(viewId: string): void {
    if (activeViewId.value === viewId) return;
    void router.replace({ query: { ...route.query, aView: viewId } });
}
</script>

<template>
    <AssistantHeader class="mx-4 flex-none" :title="title" />

    <TabBar
        class="flex-none text-sm"
        aria-label="Assistant view"
        data-region="AssistantPanelHeaderTabs"
        :active-id="activeViewId"
        :items="configOptionLocalisedConfigs"
        @select="(item) => handleSelectView(item.id)"
    >
        <template #default="{ item }">
            <div class="flex flex-none items-center gap-x-1.5">
                <component :is="item.icon" aria-hidden="true" class="size-5" :stroke-width="2" />
                {{ item.label }}
            </div>
        </template>
    </TabBar>
</template>
