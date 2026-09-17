<script setup lang="ts">
// ── Local Framework
import type { LocalisedSecondaryMeasure } from './_context';
import { T } from './ContextSecondaryMeasureList_.json'; // TODO: replace the placeholder 'secondaryMeasures.text' copy, in both 'en' and 'es'.
import { t } from '@/state/locale';

// ── Static Components
import ContextDocument from './_components/ContextDocument.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { secondaryMeasures } = defineProps<{ secondaryMeasures: LocalisedSecondaryMeasure[] }>();

defineEmits<{ edit: [secondaryMeasure: LocalisedSecondaryMeasure] }>();
</script>

<template>
    <ContextDocument :description="t(T, 'secondaryMeasures.text')" :items="secondaryMeasures" :title="t(T, 'secondaryMeasures.title')" @edit="$emit('edit', $event)" />
</template>
