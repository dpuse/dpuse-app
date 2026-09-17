<script setup lang="ts">
// ── External Dependencies & Registrations
import { UserRoundKeyIcon } from '@lucide/vue';
import { ref, useTemplateRef } from 'vue';

// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import AppleLogo from '@/components/branding/AppleLogo.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import GoogleLogo from '@/components/branding/GoogleLogo.vue';
import MicrosoftLogo from '@/components/branding/MicrosoftLogo.vue';
import Separator from '@/components/ui/Separator.vue';
import TextInput from '@/components/ui/text/TextInput.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'continue.label': { en: 'Continue', es: 'Continuar' },
    'email.label': { en: 'Email address', es: 'Dirección de correo electrónico' },
    'noAccount.text': { en: "Don't have an account?", es: 'No tengo una cuenta' },
    'or.label': { en: 'or', es: 'o' },
    'signIn.title': { en: 'Sign in', es: 'Iniciar sesión' },
    'signInApple.label': { en: 'Sign in with Apple', es: 'Iniciar sesión con Apple' },
    'signInGitHub.label': { en: 'Sign in with GitHub', es: 'Iniciar sesión con GitHub' },
    'signInGoogle.label': { en: 'Sign in with Google', es: 'Iniciar sesión con Google' },
    'signInMicrosoft.label': { en: 'Sign in with Microsoft', es: 'Iniciar sesión con Microsoft' },
    'signInPasskey.label': { en: 'Sign in with a passkey', es: 'Iniciar sesión con una clave de acceso' },
    'signUp.label': { en: 'Sign up', es: 'Inscribirse' }
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
        <h2 class="text-2xl font-normal">{{ t(TEXT, 'signIn.title') }}</h2>

        <!-- 'novalidate' suppresses the browser's own error bubbles; the fields render the messages themselves. -->
        <form ref="formReference" class="mt-2 flex flex-col gap-y-3" novalidate @submit.prevent="handleSubmit">
            <TextInput v-model="identifier" autocomplete="email" required type="email" :label="t(TEXT, 'email.label')" :placeholder="t(TEXT, 'email.label')" />
            <RectangleButton type="submit" variant="primary">{{ t(TEXT, 'continue.label') }}</RectangleButton>
        </form>

        <Separator :text="t(TEXT, 'or.label')" />

        <div class="flex flex-col gap-y-3">
            <RectangleButton class="flex justify-start gap-x-2" variant="outline"><UserRoundKeyIcon class="size-5" />{{ t(TEXT, 'signInPasskey.label') }}</RectangleButton>
            <RectangleButton class="flex justify-start gap-x-2" variant="outline"><AppleLogo class="size-5" />{{ t(TEXT, 'signInApple.label') }}</RectangleButton>
            <RectangleButton class="flex justify-start gap-x-2" variant="outline"><GoogleLogo class="size-5" />{{ t(TEXT, 'signInGoogle.label') }}</RectangleButton>
            <RectangleButton class="flex justify-start gap-x-2" variant="outline"><GitHubLogo class="size-5" />{{ t(TEXT, 'signInGitHub.label') }}</RectangleButton>
            <RectangleButton class="flex justify-start gap-x-2" variant="outline"><MicrosoftLogo class="size-5" />{{ t(TEXT, 'signInMicrosoft.label') }}</RectangleButton>
        </div>

        <Separator class="mt-3 mb-2" />
        <div class="text-center text-muted">{{ t(TEXT, 'noAccount.text') }} {{ t(TEXT, 'signUp.label') }}</div>
    </div>
</template>
