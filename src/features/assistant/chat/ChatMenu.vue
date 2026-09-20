<script setup lang="ts">
// The conversations the user can return to, opened from the composer's own bar. It carries its own trigger, the way
// 'AssistantModelMenu' beside it does, so the bar holds one element per control rather than a button here and a panel
// somewhere else.
//
// Built on that menu exactly: a popover anchored above the button, dismissed by a pointer landing outside it. No scrim
// and no modality — this sits in the bar with the composer's other controls, and dimming the thread to pick a
// conversation would treat a two-second choice as an interruption.

// ── External Dependencies & Registrations
import { GalleryVerticalEndIcon } from '@lucide/vue';
import { onClickOutside } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';

import { t } from '@/state/locale';
import { TEXT } from './ChatMenu_.json';

// ── Static Components
import IconButton from '@/components/ui/action/IconButton.vue';
import ItemButton from '@/components/ui/action/ItemButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface ChatSummaryConfig {
    id: string;
    title: string;
    timeLabel: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Sample data only. Replace with the user's own conversations once the session service can list them; today
// 'useChatSession' holds the one live thread and knows nothing of any other.
const SAMPLE_CHATS: ChatSummaryConfig[] = [
    { id: 'c1', title: 'Quarterly revenue breakdown', timeLabel: 'Today' },
    { id: 'c2', title: 'Salesforce connector setup', timeLabel: 'Today' },
    { id: 'c3', title: 'Renewable energy targets', timeLabel: 'Yesterday' },
    { id: 'c4', title: 'Support ticket trends', timeLabel: '3 Sep' },
    { id: 'c5', title: 'Onboarding a first data source', timeLabel: '1 Sep' }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const menuIsOpen = ref(false);
const menuReference = useTemplateRef<HTMLElement>('menuReference');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onClickOutside(menuReference, () => {
    menuIsOpen.value = false;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Open the chat this names. Nothing is switched yet — there is one session, so there is nothing to switch to.
function handleSelectChat(): void {
    menuIsOpen.value = false;
}
</script>

<template>
    <div ref="menuReference" class="relative">
        <!-- Shaped like the composer's other round controls, so the bar reads as one row of actions. -->
        <IconButton :accessible-label="t(TEXT, 'otherChats.aria')" :aria-expanded="menuIsOpen" aria-haspopup="true" shape="round" size="sm" @click="menuIsOpen = !menuIsOpen">
            <GalleryVerticalEndIcon class="size-4!" stroke-width="2.5" />
        </IconButton>

        <!-- Opens upward, as the model menu does: this bar sits at the bottom of the pane, so there is no room beneath
             it. Capped and scrolled rather than left to grow, because the list has no natural length. -->
        <div
            v-if="menuIsOpen"
            class="absolute bottom-full left-0 z-10 mb-1 flex max-h-80 w-72 flex-col rounded-md border border-separator bg-surface p-1 text-sm text-content shadow-md"
            role="menu"
        >
            <ScrollArea class="flex min-h-0 flex-1 flex-col" :scroll-area-padding-right="0">
                <ItemButton v-for="chat in SAMPLE_CHATS" :key="chat.id" class="mt-0.5 flex flex-col items-start first:mt-0" role="menuitem" @click="handleSelectChat">
                    <span class="w-full truncate">{{ chat.title }}</span>
                    <span class="text-xs text-subtle">{{ chat.timeLabel }}</span>
                </ItemButton>
            </ScrollArea>
        </div>
    </div>
</template>
