<script setup lang="ts">
// External Dependencies
import { UserRoundKeyIcon } from 'lucide-vue-next';
import { onUnmounted, ref } from 'vue';

// App Core
import T from '@/locales/components/session/LoginForm.json';
import { t } from '@/locales';

// App Components - Statically imported so always available, even when offline.
import AppleLogoIcon from '@/components/icon/logos/AppleLogoIcon.vue';
import Button from '@/components/button/Button.vue';
import GitHubLogoIcon from '@/components/icon/logos/GitHubLogoIcon.vue';
import GoogleLogoIcon from '@/components/icon/logos/GoogleLogoIcon.vue';
import Input from '@/components/input/Input.vue';
import MicrosoftLogoIcon from '@/components/icon/logos/MicrosoftLogoIcon.vue';
import Separator from '@/components/separator/Separator.vue';

// Properties & Emits
type Properties = { onTrigger: (identifier: string) => Promise<void> };
const { onTrigger } = defineProps<Properties>();

// ??? ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const identifier = ref('terrell.jm@icloud.com');

// Local State - Dark Mode ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const isDark = ref(document.documentElement.classList.contains('dark'));
const observer = new MutationObserver(() => (isDark.value = document.documentElement.classList.contains('dark')));
observer.observe(document.documentElement, { attributeFilter: ['class'] });
onUnmounted(() => observer.disconnect());

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleSubmit(): Promise<void> {
    await onTrigger(identifier.value);
}
</script>

<template>
    <div class="flex flex-col gap-y-3">
        <h2 class="text-2xl font-normal">{{ t(T, 'Sign_in') }}</h2>

        <form class="mt-2 flex flex-col gap-y-3">
            <Input name="email" autocomplete="email" :placeholder="t(T, 'Email_address')" :required="true" type="email" />
            <Button variant="primary" @click="handleSubmit">{{ t(T, 'Continue') }}</Button>
        </form>

        <Separator :text="t(T, 'or')" />

        <div class="flex flex-col gap-y-3">
            <Button class="flex justify-start gap-x-2" variant="outline"><UserRoundKeyIcon class="size-5" />{{ t(T, 'Sign_in_with_a_passkey') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><AppleLogoIcon class="size-5" :is-dark="isDark" />{{ t(T, 'Sign_in_with_Apple') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><GoogleLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Google') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><GitHubLogoIcon class="size-5" :is-dark="isDark" />{{ t(T, 'Sign_in_with_GitHub') }}</Button>
            <Button class="flex justify-start gap-x-2" variant="outline"><MicrosoftLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Microsoft') }}</Button>
        </div>
    </div>
</template>
