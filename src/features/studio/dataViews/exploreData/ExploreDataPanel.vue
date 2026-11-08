<script setup lang="ts">
// ── Template Notes ─ TODO: Revisit later. These belong beside their elements in the template, but a comment at the
// template's root breaks the fade between route views in development: Vue never reports the old view as gone, so the
// next one never appears. Production builds strip comments, so only development is affected.
// - Root element: a single root element is required. DataViewsLayout passes class="min-h-0 flex-1" plus the props/emit
//   above via fallthrough, and Vue can only auto-apply fallthrough attrs when a component has exactly one root node — a
//   fragment root (this used to have three: TransformDataPanel, InvestigateDataPanel, the option selector) silently
//   drops them instead, which was also leaving this panel without its flex sizing.

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Static Components
import InvestigateDataPanel from './InvestigateDataPanel.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────
// Declared (even though this is the last wizard step and never actually emits) so Vue treats these as real
// props/an real emit instead of fallthrough attrs/listeners — see the template's root-element note below for why
// that distinction matters here specifically.

defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();
</script>

<template>
    <div class="relative flex flex-col">
        <InvestigateDataPanel />
    </div>
</template>
