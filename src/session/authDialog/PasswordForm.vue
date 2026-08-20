<script setup lang="ts">
// ── External Dependencies & Registrations
import { reactive } from 'vue';
import { required } from '@regle/rules';
import { useRegle } from '@regle/core';

// ── Local Framework
import T from './PasswordForm.json';
import { t } from '@/state/locale';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/Input.vue';
import TextField from '@/components/ui/TextField.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const emit = defineEmits<{ back: []; submit: [password: string] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const form = reactive({ password: 'datapos1111' });
const { r$ } = useRegle(form, { password: { required } });

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleBack(): void {
    emit('back');
}

function handleSubmit(): void {
    r$.$validate();
    if (!r$.$invalid) emit('submit', form.password);
}
</script>

<template>
    <div class="flex flex-col gap-y-3">
        <h2 class="text-2xl font-normal">{{ t(T, 'Enter_password') }}</h2>

        <p>Enter the password for the account linked to the email address 'terrell.jm@gmail.com'.</p>

        <form class="mt-2 flex flex-col gap-y-3">
            <!-- Following required to help browsers and assistive tech recognize the form as a login or password form -->
            <Input id="userName" type="text" autocomplete="username" label="Username" placeholder="Username" style="display: none" tabindex="-1" aria-hidden="true" />

            <TextField
                v-model="form.password"
                autocomplete="current-password"
                type="password"
                :label="t(T, 'Password')"
                :placeholder="t(T, 'Password')"
                :errors="r$.password.$errors"
                @blur="r$.password.$touch()"
            />

            <Button variant="primary" @click="handleSubmit">{{ t(T, 'Continue') }}</Button>
        </form>

        <div class="flex justify-between">
            <div class="text-sm/6">
                <a href="#" class="font-semibold text-accent hover:text-accent-hover" @click="handleBack">{{ t(T, 'Back') }}</a>
            </div>
            <div class="text-sm/6">
                <a href="#" class="font-semibold text-accent hover:text-accent-hover">{{ t(T, 'Forgot_password') }}</a>
            </div>
        </div>
    </div>
</template>
