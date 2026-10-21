<script setup lang="ts">
// ── External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';

import { t } from '@/state/locale';
import { TEXT } from './EmptyPlaceholder_.json';

// ── Static Components
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineProps<{ messageItemLabel: string; descriptionItemLabel: string; actionItemLabel: string }>();
defineEmits<{ add: [] }>();
</script>

<template>
    <div class="mt-[7.5vh] text-center" data-region="EmptyPlaceholder">
        <svg class="mx-auto size-12 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
                vector-effect="non-scaling-stroke"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
        </svg>
        <h3 class="mt-2 text-sm font-semibold text-emphasis">{{ t(TEXT, 'empty.title', { label: messageItemLabel }) }}</h3>
        <p class="mt-1 text-sm text-muted">{{ t(TEXT, 'empty.text', { label: descriptionItemLabel }) }}</p>
        <div class="mt-6">
            <!-- Add ─ The same action as the page's floating add pill, with its icon, but styled as a button in the page
                 because nothing floats here. -->
            <RectangleButton class="inline-flex items-center gap-x-1.5" variant="primary" @click="$emit('add')">
                <PlusIcon aria-hidden="true" class="-ml-0.5 size-5" :stroke-width="1.25" />
                {{ t(TEXT, 'create.label', { label: actionItemLabel }) }}
            </RectangleButton>
        </div>
    </div>
</template>
