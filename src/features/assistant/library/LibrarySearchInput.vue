<script setup lang="ts">
// The library's search control: the field that filters it, and the trail showing where in the index the filtering
// started. Both come from the same URL state, so they belong in one control rather than two stacked chrome rows.
//
// Built as a pair with 'ChatInput' in the other pane — a bordered surface with the text box above and a tinted bar of
// controls below it — so the assistant's two panes read as one design. It floats over the list, which scrolls up
// behind it.
//
// The trail gives way while a search is running — results are a flat list, so there is no position in the index for it
// to describe — and returns when the query is cleared. It slides rather than cutting, because the control floats over
// the list and the list's own top padding follows its height: an abrupt change would jump the rows beneath it.

// ── External Dependencies & Registrations
import { HouseIcon } from '@lucide/vue';
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue';

// ── Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';
import { LIBRARY_DOCUMENT_TYPE_LABELS, type LibraryDocumentType, useAssistantLibrary } from '@/state/assistantLibrary';

// ── Static Components
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import TextArea from '@/components/ui/text/TextArea.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Drawn as a house in the trail, so the wording survives only as the label a reader hears — 'Breadcrumbs' takes its
// 'aria-label' from this whichever way the step is drawn.
const ROOT_LABEL = 'Library';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ heightChange: [height: number] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { path, query, searchIsActive, setPath } = useAssistantLibrary();

const barElement = useTemplateRef<HTMLElement>('barElement');

const state: { resizeObserver: ResizeObserver | null } = { resizeObserver: null };

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const breadcrumbs = computed<BreadcrumbConfig[]>(() => {
    const items: BreadcrumbConfig[] = [{ id: 'root', icon: HouseIcon, label: ROOT_LABEL }];

    // The trail is whatever the URL says, so a hand-edited or stale link can name a folder that no longer exists. An
    // unknown one is dropped rather than shown as a step that leads nowhere.
    const [typeId] = path.value;
    if (Object.hasOwn(LIBRARY_DOCUMENT_TYPE_LABELS, typeId)) items.push({ id: typeId, label: LIBRARY_DOCUMENT_TYPE_LABELS[typeId as LibraryDocumentType] });

    return items;
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// This floats over the results, so it takes no space in the flow and the scroller beneath has to reserve it by hand.
// Measured rather than stated: the height follows the text box's own type and padding, which are not this file's to
// know, and a constant here would drift the moment either changed.
onMounted(() => {
    if (!barElement.value) return;
    emit('heightChange', barElement.value.offsetHeight);
    state.resizeObserver = new ResizeObserver(() => {
        emit('heightChange', barElement.value?.offsetHeight ?? 0);
    });
    state.resizeObserver.observe(barElement.value);
});

onUnmounted(() => {
    state.resizeObserver?.disconnect();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectBreadcrumb(index: number): void {
    setPath(path.value.slice(0, index)); // The root is index 0 and names no folder, so slicing to it empties the trail.
}
</script>

<template>
    <div
        ref="barElement"
        class="flex flex-col rounded-lg border border-selected-border bg-surface shadow-md focus-within:ring-1 focus-within:ring-selected-ring"
        data-region="LibrarySearchInput"
    >
        <!-- Wrapped because 'TextArea' forwards its attributes to the text box rather than to its own root, so a class
             put on it would size the box and leave the root unable to shrink. -->
        <div class="min-w-0 pl-2.5">
            <!-- 'TextArea' rather than 'TextInput': it carries no border, background or rounding of its own, so the box
                 around it provides the frame exactly as it does for the chat composer, and its built-in clear button is
                 the same one the composer shows.
                 Held to a single line by 'wrap', not by a height: the box sizes itself to its content, so text that
                 cannot wrap measures one line however long it gets and runs sideways instead of growing. A fixed height
                 would have fought that sizing rather than removed the reason for it. Enter is stopped for the same
                 reason there is no submit — results follow the query as it is typed. -->
            <TextArea
                v-model="query"
                class="rounded-t-lg"
                label="Search the library"
                label-hidden
                placeholder="Search articles by keyword, topic…"
                rows="1"
                wrap="off"
                @keydown.enter.prevent
            />
        </div>

        <!-- The composer's action bar in the other pane, carrying the trail instead of the send controls.
             The row collapses through 'grid-template-rows' rather than a height, so nothing has to be measured for it
             to animate, and the inner element clips what is on its way out. -->
        <Transition name="trail-collapse">
            <div v-if="!searchIsActive" class="grid min-w-0 rounded-b-lg border-t border-selected-border bg-selected text-selected-text">
                <div class="min-h-0 overflow-hidden">
                    <Breadcrumbs class="px-2 py-1.5 text-xs" disable-last :items="breadcrumbs" @select="handleSelectBreadcrumb" />
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
/* Collapsing the row rather than sliding a fixed height: the trail is one line now but need not stay that way, and a
   '0fr' to '1fr' track needs no measurement to animate between. The border is folded into the transition too, or the
   rule would sit on the control's edge for the whole of the leave. */
.trail-collapse-enter-active,
.trail-collapse-leave-active {
    transition:
        grid-template-rows 0.2s ease,
        opacity 0.2s ease,
        border-top-width 0.2s ease;
}

.trail-collapse-enter-from,
.trail-collapse-leave-to {
    grid-template-rows: 0fr;
    border-top-width: 0;
    opacity: 0;
}

.trail-collapse-enter-to,
.trail-collapse-leave-from {
    grid-template-rows: 1fr;
}

@media (prefers-reduced-motion: reduce) {
    .trail-collapse-enter-active,
    .trail-collapse-leave-active {
        transition: none;
    }
}
</style>
