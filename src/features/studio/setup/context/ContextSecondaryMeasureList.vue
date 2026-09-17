<script setup lang="ts">
// ── Local Framework
import type { LocalisedSecondaryMeasure } from './_context';
import { t } from '@/state/locale';
import { TEXT } from './ContextSecondaryMeasureList_.json'; // TODO: replace the placeholder 'secondaryMeasures.text' copy, in both 'en' and 'es'.

// ── Static Components
import ContextDocument from './_components/ContextDocument.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { secondaryMeasures } = defineProps<{ secondaryMeasures: LocalisedSecondaryMeasure[] }>();

defineEmits<{ edit: [secondaryMeasure: LocalisedSecondaryMeasure] }>();
</script>

<template>
    <ContextDocument :description="t(TEXT, 'secondaryMeasures.text')" :items="secondaryMeasures" :title="t(TEXT, 'secondaryMeasures.title')" @edit="$emit('edit', $event)" />
</template>
