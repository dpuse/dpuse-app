<script setup lang="ts">
// ── External Dependencies & Registrations
import { NetworkIcon } from '@lucide/vue';

// ── Local Framework
import type { LocalisedDimension } from './_context';
import { t } from '@/state/locale';
import { TEXT } from './ContextDimensionList_.json'; // TODO: replace the placeholder 'dimensions.text' copy, in both 'en' and 'es'.

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ContextDocument from './_components/ContextDocument.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dimensions } = defineProps<{ dimensions: LocalisedDimension[] }>();

defineEmits<{ edit: [dimension: LocalisedDimension]; showTreeDiagram: [] }>();
</script>

<template>
    <ContextDocument :description="t(TEXT, 'dimensions.text')" :items="dimensions" :title="t(TEXT, 'dimensions.title')" @edit="$emit('edit', $event)">
        <template #itemActions="{ item: dimension }">
            <ActionWrapper :aria-label="t(TEXT, 'treeDiagram.aria', { label: dimension.label })" class="mr-1" @click="$emit('showTreeDiagram')">
                <NetworkIcon class="size-5" stroke-width="1.5" />
            </ActionWrapper>
        </template>
    </ContextDocument>
</template>
