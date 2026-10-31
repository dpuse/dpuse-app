<script setup lang="ts">
// ── External Dependencies & Registrations
import { HashIcon, LanguagesIcon, PlusIcon, SeparatorVerticalIcon, StarIcon, TypeIcon } from '@lucide/vue';
import { markRaw, ref } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './ComponentSamples_.json';
import { type ButtonVariant, VARIANT_CLASSES } from '@/components/ui/action/action';

// ── Static Components
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import IconButton from '@/components/ui/action/IconButton.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const BUTTON_VARIANTS = Object.keys(VARIANT_CLASSES) as ButtonVariant[]; // Read from the class table, so a new variant shows without editing this page.

const TAG_COLORS = [
    { id: 'default', color: undefined },
    { id: 'success', color: 'success' },
    { id: 'warning', color: 'warning' },
    { id: 'danger', color: 'danger' }
] as const;

// Each state of a compact select, drawn on several icons because a mark can run into an icon's lines.
const MARK_STATES = [
    { id: 'automatic', isDefault: true, labelKey: 'markState.automatic.label', tone: undefined },
    { id: 'chosen', isDefault: false, labelKey: 'markState.chosen.label', tone: 'info' },
    { id: 'assumed', isDefault: true, labelKey: 'markState.assumed.label', tone: 'warning' }
] as const;

const MARK_ICONS = [
    { icon: markRaw(LanguagesIcon), id: 'languages' },
    { icon: markRaw(SeparatorVerticalIcon), id: 'separator' },
    { icon: markRaw(TypeIcon), id: 'type' },
    { icon: markRaw(HashIcon), id: 'hash' }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const currentDialogId = ref<'confirm' | 'content'>();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleOpenDialog(dialogId: 'confirm' | 'content'): void {
    currentDialogId.value = dialogId;
}

function handleCloseDialog(): void {
    currentDialogId.value = undefined;
}
</script>

<template>
    <div class="flex flex-col gap-4">
        <!-- Buttons -->
        <div class="flex flex-wrap gap-2">
            <RectangleButton v-for="variant in BUTTON_VARIANTS" :key="variant" :variant="variant">{{ variant }}</RectangleButton>
            <RectangleButton disabled>{{ t(TEXT, 'disabled.label') }}</RectangleButton>
        </div>

        <!-- Icon Buttons ─ Plain, selected from a set, and an on/off toggle that is on. -->
        <div class="flex gap-2">
            <IconButton :accessible-label="t(TEXT, 'plain.aria')"><StarIcon /></IconButton>
            <IconButton :accessible-label="t(TEXT, 'selected.aria')" is-active><StarIcon /></IconButton>
            <IconButton :accessible-label="t(TEXT, 'pressed.aria')" :is-pressed="true"><StarIcon /></IconButton>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap items-center gap-2">
            <Tag v-for="tag in TAG_COLORS" :key="tag.id" :color="tag.color" :text="tag.id" />
        </div>

        <!-- Compact Selects ─ Unmarked when automatic, then a grey dot when chosen and an amber dot when assumed. -->
        <div v-for="markState in MARK_STATES" :key="markState.id" class="flex flex-wrap gap-2">
            <SelectInput
                v-for="markIcon in MARK_ICONS"
                :key="markIcon.id"
                is-compact
                :is-default="markState.isDefault"
                :label="t(TEXT, markState.labelKey)"
                label-hidden
                :model-value="markState.id"
                :options="[{ id: markState.id, label: t(TEXT, markState.labelKey) }]"
                :tone="markState.tone"
            >
                <template #icon><component :is="markIcon.icon" aria-hidden="true" class="size-[1.25em] flex-none text-muted" /></template>
            </SelectInput>
        </div>

        <!-- Pill Button ─ Positioned absolutely, because it normally floats over the page, so it needs a positioned box of
             its own here. -->
        <div class="relative h-14">
            <PillButton :icon="PlusIcon" icon-is-leading :label="t(TEXT, 'add.label')" />
        </div>

        <!-- Dialogs ─ Not teleported, so each opens inside its column and takes that column's colours. -->
        <div class="flex flex-wrap gap-2">
            <RectangleButton variant="outline" @click="handleOpenDialog('content')">{{ t(TEXT, 'openDialog.label') }}</RectangleButton>
            <RectangleButton variant="outline" @click="handleOpenDialog('confirm')">{{ t(TEXT, 'openConfirmDialog.label') }}</RectangleButton>
        </div>
        <Dialog :is-open="currentDialogId === 'content'" max-width="28rem" min-height="10rem" sizing="reserved" :title="t(TEXT, 'sampleDialog.title')" @close="handleCloseDialog">
            <p class="p-4">{{ t(TEXT, 'sampleDialog.text') }}</p>
        </Dialog>
        <ConfirmDialog
            :confirm-label="t(TEXT, 'delete.label')"
            :is-open="currentDialogId === 'confirm'"
            :message="t(TEXT, 'confirmDialog.text')"
            :title="t(TEXT, 'confirmDialog.title')"
            @cancel="handleCloseDialog"
            @confirm="handleCloseDialog"
        />
    </div>
</template>
