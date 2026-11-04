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

import { t } from '@/state/locale';
import { TEXT } from './ChatMenu_.json';

// ── Static Components
import IconButton from '@/components/ui/action/IconButton.vue';
import { Menu } from '@/components/ui/menu';
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

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// TODO: Open the chat this names. Nothing is switched yet — there is one session, so there is nothing to switch to.
function handleSelectChat(): void {
    // The menu closes itself.
}
</script>

<template>
    <Menu.Root>
        <!-- Shaped like the composer's other round controls, so the bar reads as one row of actions. -->
        <template #trigger="{ triggerAttributes }">
            <IconButton v-bind="triggerAttributes" :accessible-label="t(TEXT, 'otherChats.aria')" shape="round" size="sm">
                <GalleryVerticalEndIcon class="size-4!" stroke-width="2.5" />
            </IconButton>
        </template>

        <!-- Opens upward, as the model menu does: this bar sits at the bottom of the pane, so there is no room beneath
             it. Capped and scrolled rather than left to grow, because the list has no natural length. -->
        <Menu.Content class="flex w-72 flex-col [--menu-max-height:20rem]" :label="t(TEXT, 'chats.aria')" placement="top-start">
            <ScrollArea class="flex min-h-0 flex-1 flex-col" :scroll-area-padding-right="0">
                <Menu.Item v-for="chat in SAMPLE_CHATS" :key="chat.id" class="mt-0.5 first:mt-0" @select="handleSelectChat">
                    <span class="block w-full truncate">{{ chat.title }}</span>
                    <span class="block text-xs text-subtle">{{ chat.timeLabel }}</span>
                </Menu.Item>
            </ScrollArea>
        </Menu.Content>
    </Menu.Root>
</template>
