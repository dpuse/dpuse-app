<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, useAttrs, useId, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Enter_a_valid_email_address: { en: 'Enter a valid email address', es: 'Introduce una dirección de correo electrónico válida' },
    Required: { en: 'Required', es: 'Obligatorio' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

defineOptions({ inheritAttrs: false });

interface Properties {
    errors?: string[];
    id?: string;
    label?: string;
    labelHidden?: boolean;
    type?: string;
}
const { errors = [], id, label, labelHidden, type = 'text' } = defineProps<Properties>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const attributes = useAttrs();
const inputReference = useTemplateRef<HTMLInputElement>('inputReference');
const textInputId = id ?? useId();
const textValue = defineModel<string>({ default: '' });
const validationMessage = ref(''); // Set from the native 'invalid' event, raised whenever this field or its form is checked.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const allErrors = computed(() => (validationMessage.value ? [...errors, validationMessage.value] : errors));
const valueHasErrors = computed(() => allErrors.value.length > 0);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleBlur(): void {
    inputReference.value?.checkValidity(); // Raises 'invalid' when unacceptable; never shows a bubble, unlike reportValidity.
}

function handleInput(): void {
    validationMessage.value = ''; // Stop complaining while the user is fixing the value; the next check re-reports it.
}

function handleInvalid(): void {
    validationMessage.value = describeValidity(inputReference.value);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function describeValidity(element: HTMLInputElement | null | undefined): string {
    if (!element) return '';
    const { validity } = element;
    if (validity.valueMissing) return t(T, 'Required');
    if (type === 'email' && validity.typeMismatch) return t(T, 'Enter_a_valid_email_address');
    return element.validationMessage; // Remaining cases are rare, so fall back to the browser's wording, in the browser's language.
}
</script>

<template>
    <div :class="attributes.class" data-region="TextInput" :style="attributes.style as string">
        <!-- Label -->
        <label v-if="label" :for="textInputId" :class="labelHidden ? 'sr-only' : 'mb-1 block text-xs font-medium text-muted'">{{ label }}</label>

        <!-- Input -->
        <input
            :id="textInputId"
            ref="inputReference"
            v-model="textValue"
            v-bind="{ ...attributes, class: undefined, style: undefined }"
            class="w-full rounded border bg-surface px-2.5 py-1.5 text-sm text-content transition-colors placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50"
            :class="valueHasErrors ? 'border-danger-ring' : 'border-boundary focus:border-accent'"
            :type="type"
            @blur="handleBlur"
            @input="handleInput"
            @invalid.prevent="handleInvalid"
        />

        <!-- Errors -->
        <ul v-if="valueHasErrors" class="mt-1 space-y-0.5">
            <li v-for="(error, i) in allErrors" :key="i" class="text-xs text-danger-text">{{ error }}</li>
        </ul>
    </div>
</template>
