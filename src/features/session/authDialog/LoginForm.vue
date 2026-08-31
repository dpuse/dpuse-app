<script setup lang="ts">
// ── External Dependencies & Registrations
import { UserRoundKeyIcon } from '@lucide/vue';
import { ref, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import AppleLogo from '@/components/branding/AppleLogo.vue';
import Button from '@/components/ui/button/Button.vue';
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import GoogleLogo from '@/components/branding/GoogleLogo.vue';
import MicrosoftLogo from '@/components/branding/MicrosoftLogo.vue';
import Separator from '@/components/ui/Separator.vue';
import TextInput from '@/components/ui/text/TextInput.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Continue: { en: 'Continue', es: 'Continuar' },
    Email_address: { en: 'Email address', es: 'Dirección de correo electrónico' },
    "Don't_have_an_account?": { en: "Don't have an account?", es: 'No tengo una cuenta' },
    or: { en: 'or', es: 'o' },
    Sign_in: { en: 'Sign in', es: 'Iniciar sesión' },
    Sign_in_with_a_passkey: { en: 'Sign in with a passkey', es: 'Iniciar sesión con una clave de acceso' },
    Sign_in_with_Apple: { en: 'Sign in with Apple', es: 'Iniciar sesión con Apple' },
    Sign_in_with_Google: { en: 'Sign in with Google', es: 'Iniciar sesión con Google' },
    Sign_in_with_GitHub: { en: 'Sign in with GitHub', es: 'Iniciar sesión con GitHub' },
    Sign_in_with_Microsoft: { en: 'Sign in with Microsoft', es: 'Iniciar sesión con Microsoft' },
    Sign_up: { en: 'Sign up', es: 'Inscribirse' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { onTrigger } = defineProps<{ onTrigger: (identifier: string) => Promise<void> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const formReference = useTemplateRef<HTMLFormElement>('formReference');
const identifier = ref('terrell.jm@icloud.com');

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSubmit(): void {
    if (formReference.value?.checkValidity() === true) void onTrigger(identifier.value);
}
</script>

<template>
    <div class="flex flex-col gap-y-3">
        <h2 class="text-2xl font-normal">{{ t(T, 'Sign_in') }}</h2>

        <!-- 'novalidate' suppresses the browser's own error bubbles; the fields render the messages themselves. -->
        <form ref="formReference" class="mt-2 flex flex-col gap-y-3" novalidate @submit.prevent="handleSubmit">
            <TextInput v-model="identifier" autocomplete="email" required type="email" :label="t(T, 'Email_address')" :placeholder="t(T, 'Email_address')" />
            <Button type="submit" variant="primary">{{ t(T, 'Continue') }}</Button>
        </form>

        <Separator :text="t(T, 'or')" />

        <div class="flex flex-col gap-y-3">
            <Button class="flex justify-start gap-x-2" variant="outline"><UserRoundKeyIcon class="size-5" />{{ t(T, 'Sign_in_with_a_passkey') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><AppleLogo class="size-5" />{{ t(T, 'Sign_in_with_Apple') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><GoogleLogo class="size-5" />{{ t(T, 'Sign_in_with_Google') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><GitHubLogo class="size-5" />{{ t(T, 'Sign_in_with_GitHub') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><MicrosoftLogo class="size-5" />{{ t(T, 'Sign_in_with_Microsoft') }}</Button>
        </div>

        <Separator class="mt-3 mb-2" />
        <div class="text-center text-muted">{{ t(T, "Don't_have_an_account?") }} {{ t(T, 'Sign_up') }}</div>
    </div>
</template>
