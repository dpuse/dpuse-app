<script setup lang="ts">
// External dependencies
import { ref } from 'vue';
import { UserRoundKeyIcon } from 'lucide-vue-next';

// App core
import T from '@/locales/components/account/LoginForm.json';
import { t } from '@/locales';

// App components
import ActionButton from '@/components/action/ActionButton.vue';
import AppleLogoIcon from '@/components/icon/logos/AppleLogoIcon.vue';
import DPULogoIcon from '@/components/icon/logos/DPULogoIcon.vue';
import GitHubLogoIcon from '@/components/icon/logos/GitHubLogoIcon.vue';
import GoogleLogoIcon from '@/components/icon/logos/GoogleLogoIcon.vue';
import Input from '@/components/input/Input.vue';
import MicrosoftLogoIcon from '@/components/icon/logos/MicrosoftLogoIcon.vue';
import Separator from '@/components/separator/Separator.vue';

// Properties
type Properties = { onTrigger: (identifier: string) => Promise<void> };
const { onTrigger } = defineProps<Properties>();

// ??? ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const identifier = ref('terrell.jm@icloud.com');

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleSubmit(): Promise<void> {
    await onTrigger(identifier.value);
}
</script>

<template>
    <div class="flex flex-col gap-y-3 p-8">
        <DPULogoIcon class="size-12" />

        <h2 class="text-2xl font-normal">{{ t(T, 'Sign_in') }}</h2>

        <form class="mt-2 flex flex-col gap-y-3">
            <Input name="email" autocomplete="email" :placeholder="t(T, 'Email_address')" :required="true" type="email" />
            <ActionButton variant="commit" @click="handleSubmit">{{ t(T, 'Continue') }}</ActionButton>
        </form>

        <Separator :text="t(T, 'or')" />

        <div class="flex flex-col gap-y-3">
            <ActionButton class="justify-start" variant="outline"><UserRoundKeyIcon class="size-5" />{{ t(T, 'Sign_in_with_a_passkey') }}</ActionButton>
            <ActionButton class="justify-start" variant="outline"><AppleLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Apple') }}</ActionButton>
            <ActionButton class="justify-start" variant="outline"><GoogleLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Google') }}</ActionButton>
            <ActionButton class="justify-start" variant="outline"><GitHubLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_GitHub') }}</ActionButton>
            <ActionButton class="justify-start" variant="outline"><MicrosoftLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Microsoft') }}</ActionButton>
        </div>

        <Separator class="mt-3 mb-2" />

        <div class="text-muted text-center">{{ t(T, "Don't_have_an_account?") }} {{ t(T, 'Sign_up') }}</div>
    </div>
</template>
