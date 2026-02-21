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
import MicrosoftLogoIcon from '@/components/icon/logos/MicrosoftLogoIcon.vue';

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

        <form class="flex flex-col gap-y-3">
            <input
                id="email"
                name="email"
                autocomplete="email"
                :placeholder="t(T, 'Email_address')"
                required="true"
                type="email"
                class="mt-1 block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-indigo-500"
            />

            <ActionButton variant="commit" @click="handleSubmit">{{ t(T, 'Continue') }}</ActionButton>
        </form>

        <div class="relative">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
                <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center font-light">
                <span class="bg-white px-6 text-gray-900 dark:bg-gray-900 dark:text-gray-300">{{ t(T, 'or') }}</span>
            </div>
        </div>

        <div class="flex flex-col gap-y-3">
            <ActionButton class="justify-start" variant="outline"><UserRoundKeyIcon class="size-5" />{{ t(T, 'Sign_in_with_a_passkey') }}</ActionButton>
            <ActionButton class="justify-start" variant="outline"><AppleLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Apple') }}</ActionButton>
            <ActionButton class="justify-start" variant="outline"><GoogleLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Google') }}</ActionButton>
            <ActionButton class="justify-start" variant="outline"><GitHubLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_GitHub') }}</ActionButton>
            <ActionButton class="justify-start" variant="outline"><MicrosoftLogoIcon class="size-5" />{{ t(T, 'Sign_in_with_Microsoft') }}</ActionButton>
        </div>

        <div class="bg-separator mt-3 mb-2 h-px"></div>

        <div class="text-center font-light">{{ t(T, "Don't_have_an_account?") }} {{ t(T, 'Sign_up') }}</div>
    </div>
</template>
