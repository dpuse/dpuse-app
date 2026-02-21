<script setup lang="ts">
// External dependencies
import { useRouter } from 'vue-router';
import { XIcon } from 'lucide-vue-next';
import type { Action, AnyState, ContinueWithLoginIdentifierInputs, Input, State } from '@teamhanko/hanko-frontend-sdk';
import { computed, onMounted, onUnmounted, ref } from 'vue';

// App core
import { useSessionStore } from '@/stores/sessionStore';

// App components
import ActionButton from '@/components/action/ActionButton.vue';
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

// Login flow helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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
            handleCloseDialog();

            return Promise.resolve();
        case 'error':
            console.log('STATE', 'error', state.error, state);
            return Promise.resolve();
        default:
            console.log('UNEXPECTED STATE', state.name, state);
            return Promise.resolve();
    }
}

// Handle login flow initialisation state; user identifier (email address) input is required
async function handleLoginFlowInitState(state: State<'login_init'>): Promise<void> {
    const action = state.actions.continue_with_login_identifier as Action<ContinueWithLoginIdentifierInputs>;
    const input = (action.inputs.email || action.inputs.identifier) as Input<string>;
    uiStateId.value = 'enterId';
    handleIdEntered.value = async (identifier: string): Promise<void> => {
        const result = await action.run({ [input.name]: identifier });
        if (result.error) console.log(result.error, result);

        sessionState.emailAddress = identifier; // TODO: This should be moved to success state, see state.payload.user.emails...
    };
}

// Handle login flow method chooser state; only password logins are currently support
async function handleLoginFlowMethodChooserState(state: State<'login_method_chooser'>): Promise<void> {
    const action = state.actions.continue_to_password_login!;
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}

// Handle login flow password state; password input is required
async function handleLoginFlowPasswordState(state: State<'login_password'>): Promise<void> {
    const action = state.actions.password_login;
    uiStateId.value = 'enterPassword';
    handlePasswordEntered.value = async (password: string): Promise<void> => {
        const result = await action.run({ password });
        if (result.error) console.log(result.error, result);
    };
}

// Handle login flow onboarding create passkey state; creation of passkeys is currently disabled
async function handleLoginFlowOnboardingCreatePasskeyState(state: State<'onboarding_create_passkey'>): Promise<void> {
    const action = state.actions.skip!;
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleCloseDialog(): void {
    const rest = { ...router.currentRoute.value.query };
    delete rest.dialog;
    router.push({ query: { ...rest } });
}
</script>

<template>
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true"></div>

        <!-- Authentication dialog -->
        <dialog
            aria-modal="true"
            class="bg-surface relative z-10 h-full max-h-full w-full max-w-full overflow-y-auto overscroll-y-none sm:h-auto sm:w-sm sm:rounded-lg"
            open
            tabindex="-1"
        >
            <!-- Close Button -->
            <ActionButton class="absolute top-3 right-3" variant="iconLarge" @click="handleCloseDialog">
                <XIcon stroke-width="1.25" />
            </ActionButton>

            <!-- Login form -->
            <LoginForm v-if="uiStateId === 'enterId' && handleIdEntered" :on-trigger="handleIdEntered" />

            <!-- Password form -->
            <PasswordForm v-if="uiStateId === 'enterPassword' && handlePasswordEntered" :on-trigger="handlePasswordEntered" />
        </dialog>
    </div>
</template>
