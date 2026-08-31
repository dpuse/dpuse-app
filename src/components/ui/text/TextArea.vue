<script setup lang="ts">
// ── External Dependencies & Registrations
import { XIcon } from '@lucide/vue';
import { useAttrs, useId, useTemplateRef } from 'vue';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const KEYBOARD_ANIMATION_MS = 300; // iOS keyboard transition; see the caret note in 'handleClear'.

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

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClear(): void {
    textValue.value = '';
    textAreaElement.value?.focus();

    // NOTE: On iOS, the keyboard-open animation can leave WebKit's caret geometry desynced from the real
    // viewport (visualViewport.offsetTop doesn't always settle immediately) — a 1px scroll nudge is
    // the standard forced-repaint workaround to make it resync. See https://bugs.webkit.org/show_bug.cgi?id=176896.
    // Nothing else resyncs it: 'nextTick' before the focus and a 'setSelectionRange' after it were both tried on
    // device and neither moved the caret, because the desync is in WebKit's paint pass rather than in the selection.
    //
    // The resize is the signal when the keyboard animates, but a clear made while it is already open — reached by
    // opening a menu in the same bar and dismissing it, which leaves the keyboard up — changes no geometry and
    // fires nothing, stranding the caret. The timeout covers that path, and is long enough to land after the
    // animation on the path that does resize. Whichever arrives first nudges and tears the other down, so a clear
    // that never resizes cannot leave a listener behind to fire against some later, unrelated keyboard opening.
    const nudge = (): void => {
        clearTimeout(timeoutId);
        window.visualViewport?.removeEventListener('resize', nudge);
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);
    };
    const timeoutId = setTimeout(nudge, KEYBOARD_ANIMATION_MS);
    window.visualViewport?.addEventListener('resize', nudge);
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

            <!-- Clear Action -->
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
