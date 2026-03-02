<script setup lang="ts">
// External dependencies
import { ref } from 'vue';

// App core
import T from '@/locales/components/session/PasswordForm.json';
import { t } from '@/locales';

// App components
import ActionButton from '@/components/action/ActionButton.vue';
import Input from '@/components/input/Input.vue';

// Properties
const { onBack, onTrigger } = defineProps<{ onBack: () => Promise<void>; onTrigger: (password: string) => Promise<void> }>();

// ??? ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const password = ref('datapos1111');

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleBack(): Promise<void> {
    await onBack();
}

async function handleSubmit(): Promise<void> {
    await onTrigger(password.value);
}
</script>

<template>
    <div class="flex flex-col gap-y-3">
        <h2 class="text-2xl font-normal">{{ t(T, 'Enter_password') }}</h2>

        <p>Enter the password for the account linked to the email address 'terrell.jm@gmail.com'.</p>

        <form class="mt-2 flex flex-col gap-y-3">
            <!-- Following required to help browsers and assistive tech recognize the form as a login or password form -->
            <input id="username" type="text" autocomplete="username" placeholder="Username" style="display: none" tabindex="-1" aria-hidden="true" />
            <Input name="password" autocomplete="current-password" :placeholder="t(T, 'Password')" :required="true" type="password" />
            <ActionButton variant="commit" @click="handleSubmit">{{ t(T, 'Continue') }}</ActionButton>
        </form>

        <div class="flex justify-between">
            <div class="text-sm/6">
                <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300" @click="handleBack">{{ t(T, 'Back') }}</a>
            </div>
            <div class="text-sm/6">
                <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">{{ t(T, 'Forgot_password') }}</a>
            </div>
        </div>
    </div>
</template>
