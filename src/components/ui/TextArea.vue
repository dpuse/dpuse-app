<script setup lang="ts">
// ── External Dependencies & Registrations
import { XIcon } from '@lucide/vue';
import { useAttrs, useId, useTemplateRef } from 'vue';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';

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
    const element = textAreaElement.value;
    textValue.value = '';
    if (!element) return;

    // Focus synchronously within the click's user-gesture window so iOS opens the keyboard reliably.
    element.focus();
    element.setSelectionRange(0, 0);

    // On iOS, opening the keyboard animates the viewport, shifting this bottom-anchored input under a
    // caret WebKit already placed — nudge the selection again once that settles to force a redraw.
    window.visualViewport?.addEventListener('resize', () => { element.setSelectionRange(0, 0); }, { once: true });
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
