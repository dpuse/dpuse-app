<script setup lang="ts">
// ── External Dependencies & Registrations
import { useEventListener } from '@vueuse/core';
import { XIcon } from '@lucide/vue';
import { useAttrs, useId, useTemplateRef } from 'vue';

// ── Static Components
import RectangleButton from '@/components/ui/action/RectangleButton.vue';

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

useEventListener(window.visualViewport, 'resize', () => {
    const isKeyboardVisible = (window.visualViewport?.height ?? window.innerHeight) < window.innerHeight;
    if (isKeyboardVisible) textAreaElement.value?.focus();
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClear(): void {
    textValue.value = '';
    textAreaElement.value?.focus();
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
                class="block field-sizing-content w-full resize-none py-2 pr-8 pl-3 text-sm text-muted focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus-ring"
            />

            <!-- Clear Action -->
            <RectangleButton
                v-if="textValue.length > 0"
                aria-label="Clear text"
                class="absolute top-1.5 right-1.5 rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-300/20"
                @click="handleClear"
            >
                <XIcon class="size-3.5" :stroke-width="1.5" />
            </RectangleButton>
        </div>
    </div>
</template>
