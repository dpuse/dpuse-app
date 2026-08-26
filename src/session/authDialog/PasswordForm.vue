<script setup lang="ts">
// ── External Dependencies & Registrations
import { reactive } from 'vue';
import { required } from '@regle/rules';
import { useRegle } from '@regle/core';

// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import Separator from '@/components/ui/Separator.vue';
import TextInput from '@/components/ui/TextInput.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Back: { en: 'Back', es: 'Atrás' },
    Continue: { en: 'Continue', es: 'Continuar' },
    "Don't_have_an_account?": { en: "Don't have an account?", es: 'No tengo una cuenta' },
    Password: { en: 'Password', es: 'Contraseña' },
    Enter_password: { en: 'Enter password', es: 'Introducir contraseña' },
    Forgot_password: { en: 'Forgot password?', es: '¿Olvidaste tu contraseña?' },
    Sign_up: { en: 'Sign up', es: 'Inscribirse' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{ back: []; submit: [password: string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const form = reactive({ password: 'datapos1111' });
const { r$ } = useRegle(form, { password: { required } });

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleBack(): void {
    emit('back');
}

async function handleSubmit(): Promise<void> {
    await r$.$validate();
    if (!r$.$invalid) emit('submit', form.password);
}
</script>

<template>
    <div class="flex flex-col gap-y-3">
        <h2 class="text-2xl font-normal">{{ t(T, 'Enter_password') }}</h2>

        <p>Enter the password for the account linked to the email address 'terrell.jm@gmail.com'.</p>

        <form class="mt-2 flex flex-col gap-y-3">
            <!-- Following required to help browsers and assistive tech recognize the form as a login or password form -->
            <TextInput id="userName" type="text" autocomplete="username" label="Username" placeholder="Username" style="display: none" tabindex="-1" aria-hidden="true" />

            <TextInput
                v-model="form.password"
                autocomplete="current-password"
                type="password"
                :label="t(T, 'Password')"
                :placeholder="t(T, 'Password')"
                :errors="r$.password.$errors"
                @blur="r$.password.$touch()"
            />

            <Button variant="primary" @click="handleSubmit">{{ t(T, 'Continue') }}</Button>
        </form>

        <div class="flex justify-between">
            <div class="text-sm/6">
                <a href="#" class="font-semibold text-accent hover:text-accent-hover" @click="handleBack">{{ t(T, 'Back') }}</a>
            </div>
            <div class="text-sm/6">
                <a href="#" class="font-semibold text-accent hover:text-accent-hover">{{ t(T, 'Forgot_password') }}</a>
            </div>
        </div>

        <Separator class="mt-3 mb-2" />
        <div class="text-center text-muted">{{ t(T, "Don't_have_an_account?") }} {{ t(T, 'Sign_up') }}</div>
    </div>
</template>
