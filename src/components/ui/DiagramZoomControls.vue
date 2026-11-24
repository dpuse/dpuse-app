<script setup lang="ts">
// Buttons for a diagram the user can zoom. A diagram also zooms with a pinch or the mouse wheel, but nothing on screen
// says so, and neither works from the keyboard.

// ── External Dependencies & Registrations
import { MaximizeIcon, MinusIcon, PlusIcon } from '@lucide/vue';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './DiagramZoomControls_.json';

// ── Static Components
import IconButton from '@/components/ui/action/IconButton.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
    fit: []; // Show the whole diagram again.
    zoomIn: [];
    zoomOut: [];
}>();
</script>

<template>
    <div :aria-label="t(TEXT, 'controls.aria')" class="flex flex-col rounded-lg border border-pill-border bg-pill" data-region="DiagramZoomControls" role="group">
        <IconButton :accessible-label="t(TEXT, 'zoomIn.aria')" size="sm" @click="emit('zoomIn')">
            <PlusIcon />
        </IconButton>
        <IconButton :accessible-label="t(TEXT, 'zoomOut.aria')" size="sm" @click="emit('zoomOut')">
            <MinusIcon />
        </IconButton>
        <IconButton :accessible-label="t(TEXT, 'fit.aria')" size="sm" @click="emit('fit')">
            <MaximizeIcon />
        </IconButton>
    </div>
</template>
