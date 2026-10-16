<script setup lang="ts">
// ── External Dependencies & Registrations
import { onMounted, ref, shallowRef, useTemplateRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { Tool as D3Tool } from '@dpuse/dpuse-tool-d3-visualiser';

// ── Local Framework
import { establishTool } from '@/services/tools';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Static Components
import BusyBar from '@/components/ui/BusyBar.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { render, title } = defineProps<{ render: (d3Tool: D3Tool, element: HTMLElement) => Promise<unknown>; title: string }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const d3ContainerElement = useTemplateRef<HTMLDivElement>('d3Container');
const d3RenderFailure = shallowRef<AppFailure | undefined>();
const diagramIsPending = ref(true); // The diagram area is blank while the d3 tool downloads and draws, so the wait is shown.

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(() => {
    void renderDiagram();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetry(): void {
    void renderDiagram();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function renderDiagram(): Promise<void> {
    d3RenderFailure.value = undefined;
    diagramIsPending.value = true;
    try {
        const d3Tool = await establishTool<D3Tool>('d3-visualiser');
        if (d3ContainerElement.value) await render(d3Tool, d3ContainerElement.value);
    } catch (error) {
        // The title goes in the message because the context below is shared by every diagram.
        d3RenderFailure.value = raiseFailure(
            new AppError(`Failed to render diagram '${title}'`, 'dpuse-app.ContextDiagramPanel.renderDiagram', { typeId: 'handled' }, { cause: error })
        );
    } finally {
        diagramIsPending.value = false;
    }
}
</script>

<template>
    <DialogHeader class="flex-none" :title="title" />

    <ScrollArea class="min-h-0 flex-1">
        <ErrorNotice v-if="d3RenderFailure" :failures="[d3RenderFailure]" @retry="handleRetry" />

        <!-- v-show, not v-if: keeps this in the DOM so D3 always has an element to draw into, even while hidden. -->
        <BusyBar v-if="diagramIsPending" class="mx-4" />
        <div v-show="!d3RenderFailure" ref="d3Container" :aria-busy="diagramIsPending" class="p-6" />
    </ScrollArea>
</template>
