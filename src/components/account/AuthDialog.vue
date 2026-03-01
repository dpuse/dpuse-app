<script setup lang="ts">
// External dependencies
import { useRouter } from 'vue-router';
import { XIcon } from 'lucide-vue-next';
import type { Action, AnyState, ContinueWithLoginIdentifierInputs, Input, State } from '@teamhanko/hanko-frontend-sdk';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

// App core
import { AppError } from '@datapos/datapos-shared/errors';
import { reportAppError } from '@/observability/errorTracking';
import T from '@/locales/components/account/LoginForm.json';
import { t } from '@/locales';
import { useSessionStore } from '@/stores/sessionStore';

// App components
import ActionButton from '@/components/action/ActionButton.vue';
import DPULogoIcon from '@/components/icon/logos/DPULogoIcon.vue';
import LoginForm from '@/components/account/LoginForm.vue';
import Mask from '@/components/mask/Mask.vue';
import PasswordForm from '@/components/account/PasswordForm.vue';
import Separator from '@/components/separator/Separator.vue';

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const router = useRouter();
const sessionState = useSessionStore();

// Local state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const containerReference = ref<HTMLDivElement | null>(null);
const flowConstructed = ref(false);
const isClosing = ref(false);
const rootReference = ref<HTMLElement | null>(null);
const handleIdEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
const handlePasswordBack = ref<(() => Promise<void>) | undefined>(undefined);
const handlePasswordEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
const uiStateId = ref<'enterId' | 'selectSignInMethod' | 'enterPasscode' | 'enterPassword' | undefined>(undefined);

// Lifecycle event handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

onMounted(() => {
    sessionState
        .constructFlow('login', ({ state }: { state: AnyState }) => handleLoginFlowStateChange(state))
        .then(() => (flowConstructed.value = true))
        .catch((error) =>
            reportAppError(new AppError('Failed to initialise sign in flow.', 'dpuse.sessionStore.useSessionStore.constructFlow', { typeId: 'handled' }, { cause: error }))
        );
});
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
        case 'passcode_confirmation':
            return handleLoginFlowPasscodeState(state);
        case 'login_password':
            return handleLoginFlowPasswordState(state);
        case 'onboarding_create_passkey':
            return handleLoginFlowOnboardingCreatePasskeyState(state);
        case 'success':
            uiStateId.value = undefined;
            handleIdEntered.value = undefined;
            handlePasswordEntered.value = undefined;
            handlePasswordBack.value = undefined;
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
    if (uiStateId.value === undefined) {
        const action = state.actions.back;
        const result = await action.run();
        if (result.error) console.log(result.error, result);
    } else {
        const action = state.actions.continue_to_password_login!;
        const result = await action.run();
        if (result.error) console.log(result.error, result);
    }
}

// Handle login flow code state; password input is required
async function handleLoginFlowPasscodeState(state: State<'passcode_confirmation'>): Promise<void> {
    uiStateId.value = 'enterPasscode';
    handlePasswordEntered.value = async (parameter: unknown): Promise<void> => {
        console.log('PASSCODE', parameter);
    };
}

// Handle login flow password state; password input is required
async function handleLoginFlowPasswordState(state: State<'login_password'>): Promise<void> {
    uiStateId.value = 'enterPassword';
    handlePasswordEntered.value = async (password: string): Promise<void> => {
        const action = state.actions.password_login;
        const result = await action.run({ password });
        if (result.error) console.log(result.error, result);
    };
    handlePasswordBack.value = async (): Promise<void> => {
        uiStateId.value = undefined;
        const action = state.actions.back;
        const result = await action.run();
        if (result.error) console.log(result.error, result);
    };
}

// Handle login flow onboarding create passkey state; creation of passkeys is currently disabled
async function handleLoginFlowOnboardingCreatePasskeyState(state: State<'onboarding_create_passkey'>): Promise<void> {
    const action = state.actions.skip!;
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}

// Transition helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function onBeforeLeave(): void {
    const container = containerReference.value;
    if (!container) return;
    container.style.height = `${container.offsetHeight}px`;
    container.style.overflow = 'hidden';
}

function onEnter(element: Element): void {
    const container = containerReference.value;
    if (!container) return;
    const newHeight = (element as HTMLElement).offsetHeight;
    container.style.transition = 'height 0.25s ease-in-out';
    void container.offsetHeight;
    container.style.height = `${newHeight}px`;
}

function onAfterEnter(): void {
    const container = containerReference.value;
    if (!container) return;
    container.style.height = '';
    container.style.overflow = '';
    container.style.transition = '';
}

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function handleCloseDialog(): Promise<void> {
    isClosing.value = true;
    // Wait for Vue to apply the is-closing class, then read the actual animation duration for the fallback.
    await nextTick();
    await new Promise<void>((resolve) => {
        const element = rootReference.value;
        if (!element) {
            resolve();
            return;
        }
        const durationSeconds = Number.parseFloat(globalThis.getComputedStyle(element).animationDuration) || 0.2;
        const fallback = setTimeout(resolve, durationSeconds * 1000 + 100);
        element.addEventListener(
            'animationend',
            () => {
                clearTimeout(fallback);
                resolve();
            },
            { once: true }
        );
    });
    const rest = { ...router.currentRoute.value.query };
    delete rest.dialog;
    router.push({ query: { ...rest } });
}
</script>

<template>
    <div ref="rootReference" class="dialog-root fixed inset-0 z-50" :class="{ 'dialog-root--closing': isClosing }">
        <Mask />

        <div
            role="dialog"
            aria-modal="true"
            class="bg-surface text-content z-10 h-full max-h-full w-full max-w-full overflow-hidden overflow-y-auto overscroll-y-none sm:absolute sm:top-[5%] sm:left-1/2 sm:h-auto sm:max-h-[90vh] sm:w-sm sm:-translate-x-1/2 sm:rounded-lg"
            tabindex="-1"
        >
            <!-- Close Button -->
            <ActionButton class="absolute top-3 right-3" variant="iconLarge" @click="handleCloseDialog">
                <XIcon stroke-width="1.25" />
            </ActionButton>

            <div class="flex flex-col gap-y-3 p-8">
                <DPULogoIcon class="size-12" />

                <div ref="containerRef">
                    <Transition name="fade" mode="out-in" @before-leave="onBeforeLeave" @enter="onEnter" @after-enter="onAfterEnter">
                        <!-- Login form -->
                        <LoginForm v-if="uiStateId === 'enterId' && handleIdEntered" :on-trigger="handleIdEntered" />

                        <!-- Password form -->
                        <PasswordForm
                            v-else-if="uiStateId === 'enterPassword' && handlePasswordEntered && handlePasswordBack"
                            :on-trigger="handlePasswordEntered"
                            :on-back="handlePasswordBack"
                        />

                        <div v-else-if="flowConstructed">{{ t(T, 'Service_unavailable') }}</div>
                    </Transition>
                </div>

                <Separator class="mt-3 mb-2" />
                <div class="text-muted text-center">{{ t(T, "Don't_have_an_account?") }} {{ t(T, 'Sign_up') }}</div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes dialog-fade-in {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
@keyframes dialog-fade-out {
    from {
        opacity: 1;
    }
    to {
        opacity: 0;
    }
}
.dialog-root {
    animation: dialog-fade-in 0.2s ease-in-out;
}
.dialog-root--closing {
    animation: dialog-fade-out 0.15s ease-in-out forwards;
}
@media (prefers-reduced-motion: reduce) {
    .dialog-root,
    .dialog-root--closing {
        animation: none;
    }
}
.fade-enter-active {
    transition: opacity 0.2s ease-in-out;
    will-change: opacity;
}
.fade-leave-active {
    transition: opacity 0.15s ease-in-out;
    will-change: opacity;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
