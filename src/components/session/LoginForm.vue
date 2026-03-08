<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';
import { UserRoundKeyIcon } from 'lucide-vue-next';

// App Core
import T from '@/locales/components/session/LoginForm.json';
import { t } from '@/locales';

// App Components
import Button from '@/components/action/Button.vue';
import AppleLogoIcon from '@/components/icon/logos/AppleLogoIcon.vue';
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
            <Button class="justify-start" variant="outline"><UserRoundKeyIcon class="size-5" />{{ t(T, 'Sign_in_with_a_passkey') }}</Button>
            <Button class="justify-start" variant="outline"><AppleLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Apple') }}</Button>
            <Button class="justify-start" variant="outline"><GoogleLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Google') }}</Button>
            <Button class="justify-start" variant="outline"><GitHubLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_GitHub') }}</Button>
            <Button class="justify-start" variant="outline"><MicrosoftLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Microsoft') }}</Button>
        </div>
    </div>
</template>
