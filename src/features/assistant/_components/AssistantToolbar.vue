<script setup lang="ts">
// The chat and library toggles, held in the assistant header so neither pane has to leave room for them. Wide enough
// for both panes, they are independent toggles in a pill that runs into the app's assistant toggle. Narrow, only one
// pane shows at a time, so they become a labelled switch in the title's place.

// ── External Dependencies & Registrations
import { LibraryIcon, MessageSquareIcon } from '@lucide/vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './AssistantToolbar_.json';
import { PRESS_CLASSES, SEGMENT_SELECTED_CLASSES, UNSELECTED_CLASSES } from '@/components/ui/action/action';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ToggleButton from '@/components/ui/action/ToggleButton.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type AssistantPaneId = 'chat' | 'library';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PANE_CONFIGS = [
    { id: 'chat', icon: MessageSquareIcon, labelKey: 'chat.label' },
    { id: 'library', icon: LibraryIcon, labelKey: 'library.label' }
] as const;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { chatIsVisible, isSwitch, libraryIsVisible } = defineProps<{ chatIsVisible: boolean; isSwitch: boolean; libraryIsVisible: boolean }>();

defineEmits<{ toggle: [paneId: AssistantPaneId] }>();

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function isPaneVisible(paneId: AssistantPaneId): boolean {
    return paneId === 'chat' ? chatIsVisible : libraryIsVisible;
}
</script>

<template>
    <!-- Switch - One pane at a time, so the selected segment names the pane in front and the title can go. -->
    <div
        v-if="isSwitch"
        :aria-label="t(TEXT, 'group.aria')"
        class="flex items-center gap-x-1 rounded-full bg-black/4 p-1 dark:bg-white/6"
        data-region="AssistantToolbar"
        role="group"
    >
        <ActionWrapper
            v-for="pane in PANE_CONFIGS"
            :key="pane.id"
            :aria-pressed="isPaneVisible(pane.id)"
            class="rounded-full px-3 py-1 text-sm"
            :class="[PRESS_CLASSES, isPaneVisible(pane.id) ? SEGMENT_SELECTED_CLASSES : UNSELECTED_CLASSES]"
            @click="$emit('toggle', pane.id)"
        >
            {{ t(TEXT, pane.labelKey) }}
        </ActionWrapper>
    </div>

    <!-- Pill - The same height as the app's assistant toggle and ending at its right edge, with a trailing spacer the
         toggle is fixed over, so the pill reads as growing out of its left side. 'mt-1.75' and '-mr-1' are that
         toggle's own 7px top offset and the 4px between this header's edge and the toggle's. -->
    <div
        v-else
        :aria-label="t(TEXT, 'group.aria')"
        class="mt-1.75 -mr-1 flex h-10 flex-none items-center gap-x-1 self-start rounded-full bg-black/4 pl-0.75 dark:bg-white/6"
        data-region="AssistantToolbar"
        role="group"
    >
        <ToggleButton
            v-for="pane in PANE_CONFIGS"
            :key="pane.id"
            :accessible-label="t(TEXT, pane.labelKey)"
            :is-open="isPaneVisible(pane.id)"
            is-segment
            size="sm"
            @click="$emit('toggle', pane.id)"
        >
            <component :is="pane.icon" :stroke-width="1.5" />
        </ToggleButton>
        <div class="size-10 flex-none" />
    </div>
</template>
