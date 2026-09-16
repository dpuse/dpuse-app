<script setup lang="ts">
// ── Local Framework
import type { LocalisedSecondaryMeasure } from './_context';

// ── Static Components
import ContextDocument from './_components/ContextDocument.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { secondaryMeasures } = defineProps<{ secondaryMeasures: LocalisedSecondaryMeasure[] }>();

defineEmits<{ edit: [] }>();
</script>

<template>
    <ContextDocument description="The measures ... this model." :items="secondaryMeasures" title="Secondary Measures" @edit="$emit('edit')" />
</template>
