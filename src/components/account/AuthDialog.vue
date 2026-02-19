<script setup lang="ts">
// External dependencies
import { useRouter } from 'vue-router';
import type { Action, AnyState, ContinueWithLoginIdentifierInputs, Input, State } from '@teamhanko/hanko-frontend-sdk';
import { computed, onMounted, onUnmounted, ref } from 'vue';

// App core
import { useSessionStore } from '@/stores/sessionStore';

// App components
import LoginForm from '@/components/account/LoginForm.vue';
import PasswordForm from '@/components/account/PasswordForm.vue';

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const router = useRouter();
const sessionState = useSessionStore();

// Local state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const handleIdEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
const handlePasswordEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
const uiStateId = ref<'enterId' | 'enterPassword' | 'done'>('enterId');

const show = computed(() => router.currentRoute.value.query.dialog === 'auth');

// Lifecycle event handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(async () => sessionState.constructFlow('login', ({ state }: { state: AnyState }) => handleLoginFlowStateChange(state)));
onUnmounted(() => sessionState.destroyFlow());

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function closeDialog(): void {
    const rest = { ...router.currentRoute.value.query };
    delete rest.dialog;
    router.push({ query: { ...rest } });
}

// Handle login flow state change.
function handleLoginFlowStateChange(state: AnyState): Promise<void> {
    switch (state.name) {
        case 'preflight':
            return Promise.resolve();
        case 'login_init':
            return handleLoginFlowInitState(state);
        case 'login_method_chooser':
            return handleLoginFlowMethodChooserState(state);
        case 'login_password':
            return handleLoginFlowPasswordState(state);
        case 'onboarding_create_passkey':
            return handleLoginFlowOnboardingCreatePasskeyState(state);
        case 'success':
            console.log('SUCCESS', state);
            uiStateId.value = 'done';
            handleIdEntered.value = undefined;
            handlePasswordEntered.value = undefined;
            sessionState.destroyFlow();
            return Promise.resolve();
        case 'error':
            console.log('STATE', 'error', state.error, state);
            return Promise.resolve();
        default:
            console.log('UNEXPECTED STATE', state.name, state);
            return Promise.resolve();
    }
}

// Handle login flow initialisation state. User identifier (email address) input is required.
async function handleLoginFlowInitState(state: State<'login_init'>): Promise<void> {
    const action = state.actions.continue_with_login_identifier as Action<ContinueWithLoginIdentifierInputs>;
    const input = (action.inputs.email || action.inputs.identifier) as Input<string>;
    uiStateId.value = 'enterId';
    handleIdEntered.value = async (identifier: string) => {
        const result = await action.run({ [input.name]: identifier });
        if (result.error) console.log(result.error, result);

        sessionState.emailAddress = identifier; // TODO: This should be moved to success state, see state.payload.user.emails...
    };
}

// Handle login flow method chooser state. Only password logins are support.
async function handleLoginFlowMethodChooserState(state: State<'login_method_chooser'>): Promise<void> {
    const action = state.actions.continue_to_password_login!;
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}

// Handle login flow password state. Password input is required.
async function handleLoginFlowPasswordState(state: State<'login_password'>): Promise<void> {
    const action = state.actions.password_login;
    uiStateId.value = 'enterPassword';
    handlePasswordEntered.value = async (password: string) => {
        const result = await action.run({ password });
        if (result.error) console.log(result.error, result);
    };
}

// Handle login flow onboarding create passkey state. Creation of passkeys is disabled.
async function handleLoginFlowOnboardingCreatePasskeyState(state: State<'onboarding_create_passkey'>): Promise<void> {
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
