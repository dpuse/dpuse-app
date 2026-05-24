<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';

// Local (App) Framework
import T from './PasswordForm.json';
import { t } from '@/state/locale';

// Local Components - Static
import Button from '@/components/elementary/button/Button.vue';
import Input from '@/components/elementary/input/Input.vue';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { onBack, onTrigger } = defineProps<{ onBack: () => Promise<void>; onTrigger: (password: string) => Promise<void> }>();

// ??? ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const password = ref('datapos1111');

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

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
            <Input id="userName" type="text" autocomplete="username" label="Username" placeholder="Username" style="display: none" tabindex="-1" aria-hidden="true" />
            <Input id="password" autocomplete="current-password" :label="t(T, 'Password')" :placeholder="t(T, 'Password')" :required="true" type="password" />
            <Button variant="primary" @click="handleSubmit">{{ t(T, 'Continue') }}</Button>
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
