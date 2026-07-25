<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ComponentBase } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework

// ── Local Components - Static
import type { GridListItem } from './ContextList.vue';

// ── Options, Properties, Slots & Emits ───────────────────────────────────────────────────────────────────────────────

const { modelReference } = defineProps<{ modelReference: GridListItem<LocalisedConfig<ComponentBase>> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────
</script>

<template>
    <div class="p-4">{{ modelReference }}</div>
</template>
