<script setup lang="ts">
import type { Action, AnyState, ContinueWithLoginIdentifierInputs, Input, State } from '@teamhanko/hanko-frontend-sdk';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LoginForm from '@/components/block/account/LoginForm.vue';
import PasswordForm from '@/components/block/account/PasswordForm.vue';

import { useSessionStore } from '@/stores/sessionStore';

const route = useRoute();
const router = useRouter();
const sessionState = useSessionStore();

const show = computed(() => route.query.dialog === 'auth');

const handleIdEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
const handlePasswordEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
const uiStateId = ref<'enterId' | 'enterPassword' | 'done'>('enterId');
onMounted(async () => {
    // if (sessionState.isAuthenticated) return;
    sessionState.constructFlow('login', ({ state }: { state: AnyState }) => handleLoginFlowStateChange(state));
});
onUnmounted(() => sessionState.destroyFlow());

function closeDialog() {
    const rest = { ...route.query };
    delete rest.dialog;
    router.push({ query: { ...rest } });
}

// Handle login flow state change.
function handleLoginFlowStateChange(state: AnyState) {
    switch (state.name) {
        case 'preflight':
            return;
        case 'login_init':
            return handleLoginFlowInitState(state);
        case 'login_method_chooser':
            return handleLoginFlowMethodChooserState(state);
        case 'login_password':
            return handleLoginFlowPasswordState(state);
        case 'onboarding_create_passkey':
            return handleLoginFlowOnboardingCreatePasskeyState(state);
        case 'success':
            uiStateId.value = 'done';
            handleIdEntered.value = undefined;
            handlePasswordEntered.value = undefined;
            sessionState.destroyFlow();
            return;
        case 'error':
            console.log('STATE', 'error', state.error, state);
            return;
        default:
            console.log('UNEXPECTED STATE', state.name, state);
            return;
    }
}

// Handle login flow initialisation state. User identifier (email address) input is required.
async function handleLoginFlowInitState(state: State<'login_init'>) {
    const action = state.actions.continue_with_login_identifier as Action<ContinueWithLoginIdentifierInputs>;
    const input = (action.inputs.email || action.inputs.identifier) as Input<string>;
    uiStateId.value = 'enterId';
    handleIdEntered.value = async (identifier: string) => {
        const result = await action.run({ [input.name]: identifier });
        if (result.error) console.log(result.error, result);

        sessionState.emailAddress = identifier; // TODO: This should be moved to success state
    };
}

// Handle login flow method chooser state. Only password logins are support.
async function handleLoginFlowMethodChooserState(state: State<'login_method_chooser'>) {
    const action = state.actions.continue_to_password_login!;
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}

// Handle login flow password state. Password input is required.
async function handleLoginFlowPasswordState(state: State<'login_password'>) {
    const action = state.actions.password_login;
    uiStateId.value = 'enterPassword';
    handlePasswordEntered.value = async (password: string) => {
        const result = await action.run({ password });
        if (result.error) console.log(result.error, result);
    };
}

// Handle login flow onboarding create passkey state. Creation of passkeys is disabled.
async function handleLoginFlowOnboardingCreatePasskeyState(state: State<'onboarding_create_passkey'>) {
    const action = state.actions.skip!;
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}
</script>

<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true"></div>

        <!-- Modal Dialog -->
        <div class="bg-background relative z-10 rounded-lg p-6 shadow-lg md:p-10" role="dialog" aria-modal="true" tabindex="-1">
            <!-- Close Button -->
            <button
                @click="closeDialog"
                aria-label="Close"
                class="focus:ring-primary absolute top-3 right-3 rounded-full p-1 text-gray-500 hover:text-gray-900 focus:ring-2 focus:outline-none"
            >
                <span aria-hidden="true">&times;</span>
            </button>

            <div v-if="uiStateId === 'enterId' && handleIdEntered">
                <LoginForm class="max-w-sm min-w-sm" :on-trigger="handleIdEntered" />
            </div>

            <div v-if="uiStateId === 'enterPassword' && handlePasswordEntered">
                <PasswordForm class="max-w-sm min-w-sm" :on-trigger="handlePasswordEntered" />
            </div>
        </div>
    </div>
</template>
