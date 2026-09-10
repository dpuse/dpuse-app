<script setup lang="ts">
// ── External Dependencies & Registrations
import { ref, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import Separator from '@/components/ui/Separator.vue';
import TextInput from '@/components/ui/text/TextInput.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    'back.label': { en: 'Back', es: 'Atrás' },
    'continue.label': { en: 'Continue', es: 'Continuar' },
    'enterPassword.title': { en: 'Enter password', es: 'Introducir contraseña' },
    'forgotPassword.label': { en: 'Forgot password?', es: '¿Olvidaste tu contraseña?' },
    'noAccount.text': { en: "Don't have an account?", es: 'No tengo una cuenta' },
    'password.label': { en: 'Password', es: 'Contraseña' },
    'signUp.label': { en: 'Sign up', es: 'Inscribirse' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ back: []; submit: [password: string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const formReference = useTemplateRef<HTMLFormElement>('formReference');
const password = ref('datapos1111');

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleBack(): void {
    emit('back');
}

function handleSubmit(): void {
    if (formReference.value?.checkValidity() === true) emit('submit', password.value);
}
</script>

<template>
    <div class="flex flex-col gap-y-3">
        <h2 class="text-2xl font-normal">{{ t(T, 'enterPassword.title') }}</h2>

        <p>Enter the password for the account linked to the email address 'terrell.jm@gmail.com'.</p>

        <!-- 'novalidate' suppresses the browser's own error bubbles; the fields render the messages themselves. -->
        <form ref="formReference" class="mt-2 flex flex-col gap-y-3" novalidate @submit.prevent="handleSubmit">
            <!-- Following required to help browsers and assistive tech recognize the form as a login or password form -->
            <TextInput id="userName" type="text" autocomplete="username" label="Username" placeholder="Username" style="display: none" tabindex="-1" aria-hidden="true" />

            <TextInput v-model="password" autocomplete="current-password" required type="password" :label="t(T, 'password.label')" :placeholder="t(T, 'password.label')" />

            <RectangleButton type="submit" variant="primary">{{ t(T, 'continue.label') }}</RectangleButton>
        </form>

        <div class="flex justify-between">
            <div class="text-sm/6">
                <a href="#" class="font-semibold text-accent hover:text-accent-hover" @click="handleBack">{{ t(T, 'back.label') }}</a>
            </div>
            <div class="text-sm/6">
                <a href="#" class="font-semibold text-accent hover:text-accent-hover">{{ t(T, 'forgotPassword.label') }}</a>
            </div>
        </div>

        <Separator class="mt-3 mb-2" />
        <div class="text-center text-muted">{{ t(T, 'noAccount.text') }} {{ t(T, 'signUp.label') }}</div>
    </div>
</template>
