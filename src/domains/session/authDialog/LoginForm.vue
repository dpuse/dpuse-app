<script setup lang="ts">
// External Dependencies
import { UserRoundKeyIcon } from 'lucide-vue-next';
import { onUnmounted, ref } from 'vue';

// Local (App) Framework
import T from './LoginForm.json';
import { t } from '@/state/locale';

// Local Components - Static
import AppleLogo from '@/components/branding/AppleLogo.vue';
import Button from '@/components/ui/button/Button.vue';
import GitHubLogo from '@/components/branding/GitHubLogo.vue';
import GoogleLogo from '@/components/branding/GoogleLogo.vue';
import Input from '@/components/ui/input/Input.vue';
import MicrosoftLogo from '@/components/branding/MicrosoftLogo.vue';
import Separator from '@/components/ui/separator/Separator.vue';

// Options, Properties, Slots, ModelValue & Emits ──────────────────────────────────────────────────────────────────────

const { onTrigger } = defineProps<{ onTrigger: (identifier: string) => Promise<void> }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const identifier = ref('terrell.jm@icloud.com');
const isDark = ref(document.documentElement.classList.contains('dark'));

// ??? ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const observer = new MutationObserver(() => (isDark.value = document.documentElement.classList.contains('dark')));
observer.observe(document.documentElement, { attributeFilter: ['class'] });
onUnmounted(() => observer.disconnect());

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    await onTrigger(identifier.value);
}
</script>

<template>
    <div class="flex flex-col gap-y-3">
        <h2 class="text-2xl font-normal">{{ t(T, 'Sign_in') }}</h2>

        <form class="mt-2 flex flex-col gap-y-3">
            <Input id="emailAddress" autocomplete="email" :label="t(T, 'Email_address')" :placeholder="t(T, 'Email_address')" :required="true" type="email" />
            <Button variant="primary" @click="handleSubmit">{{ t(T, 'Continue') }}</Button>
        </form>

        <Separator :text="t(T, 'or')" />

        <div class="flex flex-col gap-y-3">
            <Button class="flex justify-start gap-x-2" variant="outline"><UserRoundKeyIcon class="size-5" />{{ t(T, 'Sign_in_with_a_passkey') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><AppleLogo class="size-5" :is-dark="isDark" />{{ t(T, 'Sign_in_with_Apple') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><GoogleLogo class="size-5" />{{ t(T, 'Sign_in_with_Google') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><GitHubLogo class="size-5" :is-dark="isDark" />{{ t(T, 'Sign_in_with_GitHub') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><MicrosoftLogo class="size-5" />{{ t(T, 'Sign_in_with_Microsoft') }}</Button>
        </div>
    </div>
</template>
