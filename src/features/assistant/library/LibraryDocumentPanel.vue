<script setup lang="ts">
// A document opened from the library, filling that pane and stopping at its edge — the chat beside it carries on. A
// document is what the user came for, so it takes the pane outright: an opaque surface, no scrim and no raised card,
// because there is nothing to see behind it and a floating panel would only shrink what there is to read.
//
// Not built from 'Dialog': that promotes its element with 'showModal', which puts it in the browser's top layer
// over the entire viewport, and this has to stay inside one pane.

// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import CloseButton from '@/components/ui/action/CloseButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'close.aria': { en: 'Close the document', es: 'Cerrar el documento' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { snippet, source, title, typeLabel } = defineProps<{ snippet: string; source: string; title: string; typeLabel: string }>();

defineEmits<{ close: [] }>();
</script>

<template>
    <div class="absolute inset-0 z-30 flex flex-col bg-surface" data-region="LibraryDocumentPanel">
        <!-- 'z-30' clears the library's search field at 'z-20', which floats over the page this covers. Sealed into the
             layout's '@container' stacking context, clear of the app-level ladder. -->

        <!-- Full width of the pane, so its scrollbar sits at the pane's edge rather than beside the article. -->
        <ScrollArea class="min-h-0 flex-1">
            <!-- Heading and body are one column inside the scroller, so they scroll together and share a single
                 measure. Declared once and on one element, which is also what keeps it one width: 'max-w-prose' is
                 65ch, and 'ch' resolves against the font size of whatever element carries it, so the same class written
                 on both a 'text-sm' body and a heading above it yields two different widths. -->
            <div class="mx-auto max-w-prose p-4">
                <header class="border-b border-separator pr-10 pb-3">
                    <div class="flex max-w-full items-center gap-x-2">
                        <Tag :text="typeLabel" />
                        <h2 class="truncate font-medium text-emphasis">{{ title }}</h2>
                    </div>
                    <p class="mt-1 truncate text-xs text-subtle">{{ source }}</p>
                </header>

                <div class="pt-4 text-sm">
                    <p class="text-muted">{{ snippet }}</p>

                    <!-- TODO: Placeholder body. Replace with the document's own content once the knowledge base serves
                         it; this exists so the panel can be laid out and read at a realistic length. -->
                    <h3 class="mt-6 mb-1 font-medium text-emphasis">Overview</h3>
                    <p class="text-muted">
                        Quis tellus eget adipiscing convallis sit sit eget aliquet quis. Suspendisse eget egestas a elementum pulvinar et feugiat blandit at. In mi viverra elit
                        nunc.
                    </p>

                    <h3 class="mt-6 mb-1 font-medium text-emphasis">Details</h3>
                    <p class="text-muted">
                        Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu. Phasellus est
                        cursus egestas dolor sit amet sagittis.
                    </p>

                    <h3 class="mt-6 mb-1 font-medium text-emphasis">Usage</h3>
                    <p class="text-muted">
                        Turpis tortor quis scelerisque diam id accumsan nullam tempus. Suspendisse eget egestas a elementum pulvinar et feugiat blandit at. Quis tellus eget
                        adipiscing convallis sit sit eget aliquet quis.
                    </p>
                </div>
            </div>
        </ScrollArea>

        <!-- Pinned rather than carried in the heading, which now scrolls away: a document that cannot be dismissed
             without scrolling back to the top is a trap. -->
        <CloseButton :aria-label="t(TEXT, 'close.aria')" class="absolute top-3 right-3 bg-surface shadow-md" @click="$emit('close')" />
    </div>
</template>
