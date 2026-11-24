<script setup lang="ts">
// Buttons for a diagram the user can zoom. A diagram also zooms with a pinch or the mouse wheel, but nothing on screen
// says so, and neither works from the keyboard. They make a pill like the page's other floating actions, with zoom out
// before zoom in, as a slider runs from less to more.

// ── External Dependencies & Registrations
import { MaximizeIcon, ZoomInIcon, ZoomOutIcon } from '@lucide/vue';

// ── Local Framework
import { PILL_CLASSES } from '@/components/ui/action/action';
import { t } from '@/state/locale';
import { TEXT } from './DiagramZoomControls_.json';

// ── Static Components
import PillSegment from '@/components/ui/action/PillSegment.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
    fit: []; // Show the whole diagram again.
    zoomIn: [];
    zoomOut: [];
}>();
</script>

<template>
    <!-- '-ml-px' moves the first segment's dividing line under the pill's border. -->
    <div :aria-label="t(TEXT, 'controls.aria')" class="h-10 overflow-hidden shadow-md" :class="PILL_CLASSES" data-region="DiagramZoomControls" role="group">
        <div class="-ml-px flex h-full">
            <PillSegment :icon="ZoomOutIcon" is-label-hidden :label="t(TEXT, 'zoomOut.aria')" @click="emit('zoomOut')" />
            <PillSegment :icon="ZoomInIcon" is-label-hidden :label="t(TEXT, 'zoomIn.aria')" @click="emit('zoomIn')" />
            <PillSegment :icon="MaximizeIcon" is-label-hidden :label="t(TEXT, 'fit.aria')" @click="emit('fit')" />
        </div>
    </div>
</template>
