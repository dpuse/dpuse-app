<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { TriangleAlertIcon } from '@lucide/vue';

// ── Local Framework
import { TEXT } from './ItemChangedNotice_.json';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { changedAt, isDisabled } = defineProps<{
    changedAt: number; // When the item was last changed in its source.
    isDisabled?: boolean; // While the step is reading the item, so a second read cannot start.
}>();

const emit = defineEmits<{
    ignore: [];
    refresh: [];
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const noticeText = computed(() => {
    const changedAtText = new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeStyle: 'short' }).format(changedAt);
    return t(TEXT, 'changed.text', { changedAt: changedAtText });
});
</script>

<template>
    <!-- Item Changed ─ A warning, in the warning colours used elsewhere, because the data view's preview, audit and
         records are all from an earlier version of its item. The same on every step, with one decision: refresh the data
         view from the changed item, or ignore the change. The actions are underlined in the warning colour, because
         accent blue reads poorly on the warning fill. They wrap below the text on a narrow screen. -->
    <div
        class="flex flex-none flex-wrap items-center gap-x-3 gap-y-1 border-b border-warning-border bg-warning px-page py-2 text-sm text-warning-text"
        data-region="ItemChangedNotice"
        role="status"
    >
        <TriangleAlertIcon aria-hidden="true" class="size-4.5 flex-none" :stroke-width="1.5" />
        <p class="min-w-0 flex-1">{{ noticeText }}</p>
        <div class="flex flex-none items-center gap-x-3">
            <ActionWrapper class="font-medium underline underline-offset-2 enabled:hover:decoration-2 disabled:opacity-50" :disabled="isDisabled" @click="emit('refresh')">{{
                t(TEXT, 'refresh.label')
            }}</ActionWrapper>
            <ActionWrapper class="font-medium underline underline-offset-2 hover:decoration-2" @click="emit('ignore')">{{ t(TEXT, 'ignore.label') }}</ActionWrapper>
        </div>
    </div>
</template>
