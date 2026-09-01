<script setup lang="ts">
// ── External Dependencies & Registrations
import { XIcon } from '@lucide/vue';
import { useAttrs, useId, useTemplateRef, watch } from 'vue';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const KEYBOARD_ANIMATION_MS = 300; // iOS keyboard transition; see the caret note in 'resyncCaret'.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineOptions({ inheritAttrs: false });

interface Properties {
    id?: string;
    label?: string;
    labelHidden?: boolean;
}
const { id, label, labelHidden } = defineProps<Properties>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const attributes = useAttrs();
const textAreaId = id ?? useId();
const textValue = defineModel<string>({ default: '' });
const textAreaElement = useTemplateRef<HTMLTextAreaElement>('textAreaElement');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// Emptying the box is what strands the caret, and the routes that do it do not share a handler: the clear button
// below, a send that resets the bound value from the parent, and a backspace over the last character all arrive
// separately, and only meet at the value itself. Watching the value therefore covers the send path, which never
// passed through this component's own code at all. Post-flush so the 'field-sizing-content' collapse is already in
// the DOM, and only while the box holds focus, since an unfocused textarea has no caret to resync.
watch(
    textValue,
    (newValue, oldValue) => {
        if (newValue !== '' || oldValue === '') return;
        if (document.activeElement !== textAreaElement.value) return;
        resyncCaret();
    },
    { flush: 'post' }
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClear(): void {
    textValue.value = '';
    textAreaElement.value?.focus();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// NOTE: On iOS, WebKit leaves the caret where the box used to be — the overlay is composited separately and does not
// follow either a 'field-sizing-content' collapse or a keyboard transition. A 1px scroll nudge is the standard
// forced-repaint workaround that makes it resync. See https://bugs.webkit.org/show_bug.cgi?id=176896.
// Nothing else does it: 'nextTick' before the focus and a 'setSelectionRange' after it were both tried on device and
// neither moved the caret, because the desync is in the paint pass rather than in the selection.
function nudge(): void {
    window.scrollBy(0, 1);
    window.scrollBy(0, -1);
}

// The nudge is always deferred, never immediate. Scrolling while the keyboard is still animating does not net back
// to zero — the scrollable range is growing underneath the two calls, so the second is clamped against a different
// range than the first and the composer is left parked off-screen. It has to land on a settled viewport.
function resyncCaret(): void {
    // The resize is the signal while a keyboard transition is running; a clear made with the keyboard already up
    // changes no geometry and fires nothing, so the timeout covers that. Whichever arrives first nudges and tears
    // the other down, so no clear can leave a listener behind to fire against a later, unrelated keyboard opening.
    const settle = (): void => {
        clearTimeout(timeoutId);
        window.visualViewport?.removeEventListener('resize', settle);
        nudge();
    };
    const timeoutId = setTimeout(settle, KEYBOARD_ANIMATION_MS);
    window.visualViewport?.addEventListener('resize', settle);
}
</script>

<template>
    <div data-region="TextArea">
        <!-- Label -->
        <label v-if="label" :for="textAreaId" :class="labelHidden ? 'sr-only' : 'mb-1 block text-sm font-medium text-muted'">{{ label }}</label>

        <div class="relative">
            <!-- Input -->
            <textarea
                :id="textAreaId"
                ref="textAreaElement"
                v-model="textValue"
                v-bind="attributes"
                class="block field-sizing-content w-full resize-none py-2 pr-8 pl-3 text-sm text-muted outline-none"
            />

            <!-- Clear Action - deliberately does NOT suppress the blur, though that would stop the first tap after
                 the keyboard appears closing it instead of clearing. The caret fix below rides on the keyboard closing
                 and reopening: that transition is what fires the resize the nudge waits for. Hold focus here and the
                 keyboard never moves, so the nudge never runs and the caret is stranded — a worse bug than the one it
                 would fix. -->
            <Button
                v-if="textValue.length > 0"
                aria-label="Clear text"
                class="absolute top-1.5 right-1.5 rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-300/20"
                shape="minimal"
                @click="handleClear"
            >
                <XIcon class="size-3.5" :stroke-width="1.5" />
            </Button>
        </div>
    </div>
</template>
