<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRegle } from '@regle/core';
import { UserRoundKeyIcon } from '@lucide/vue';
import { email, required } from '@regle/rules';
import { onUnmounted, reactive, ref } from 'vue';

// ── Local Framework
import T from './LoginForm.json';
import { t } from '@/state/locale';

// ── Local Components - Static
import AppleLogo from '@/components/branding/AppleLogo.vue';
import Button from '@/components/ui/button/Button.vue';
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import GoogleLogo from '@/components/branding/GoogleLogo.vue';
import MicrosoftLogo from '@/components/branding/MicrosoftLogo.vue';
import Separator from '@/components/ui/Separator.vue';
import TextField from '@/components/ui/TextField.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { onTrigger } = defineProps<{ onTrigger: (identifier: string) => Promise<void> }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const form = reactive({ identifier: 'terrell.jm@icloud.com' });
const { r$ } = useRegle(form, { identifier: { required, email } });

const appearanceIsDark = ref(document.documentElement.classList.contains('dark'));

const observer = new MutationObserver(() => (appearanceIsDark.value = document.documentElement.classList.contains('dark')));
observer.observe(document.documentElement, { attributeFilter: ['class'] });

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onUnmounted(() => observer.disconnect());

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    await r$.$validate();
    if (!r$.$invalid) await onTrigger(form.identifier);
}
</script>

<template>
    <div class="flex flex-col gap-y-3">
        <h2 class="text-2xl font-normal">{{ t(T, 'Sign_in') }}</h2>

        <form class="mt-2 flex flex-col gap-y-3">
            <TextField
                v-model="form.identifier"
                autocomplete="email"
                type="email"
                :label="t(T, 'Email_address')"
                :placeholder="t(T, 'Email_address')"
                :errors="r$.identifier.$errors"
                @blur="r$.identifier.$touch()"
            />
            <Button variant="primary" @click="handleSubmit">{{ t(T, 'Continue') }}</Button>
        </form>

        <Separator :text="t(T, 'or')" />

        <div class="flex flex-col gap-y-3">
            <Button class="flex justify-start gap-x-2" variant="outline"><UserRoundKeyIcon class="size-5" />{{ t(T, 'Sign_in_with_a_passkey') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><AppleLogo class="size-5" :is-dark="appearanceIsDark" />{{ t(T, 'Sign_in_with_Apple') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><GoogleLogo class="size-5" />{{ t(T, 'Sign_in_with_Google') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><GitHubLogo class="size-5" :is-dark="appearanceIsDark" />{{ t(T, 'Sign_in_with_GitHub') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><MicrosoftLogo class="size-5" />{{ t(T, 'Sign_in_with_Microsoft') }}</Button>
        </div>
    </div>
</template>
