<script setup lang="ts">
// ── External Dependencies & Registrations
import type { Action, AnyState, ContinueWithLoginIdentifierInputs, Input, State } from '@teamhanko/hanko-frontend-sdk';
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import { reportAppError } from '@/observability/errorTracking';
import T from './LoginForm.json';
import { t } from '@/state/locale';
import { constructFlow, destroyFlow, emailAddress } from '@/state/session';

// ── Static Components
import DialogLayout from '@/components/ui/dialog/DialogLayout.vue';
import DialogModal from '@/components/ui/dialog/DialogModal.vue';
import DPUseLogo from '@/components/branding/DPUseLogo.vue';
import LoginForm from '@/session/authDialog/LoginForm.vue';
import PasswordForm from '@/session/authDialog/PasswordForm.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const containerElement = useTemplateRef<HTMLDivElement>('container');
const flowConstructed = ref(false);
const handleIdEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
const handlePasswordBack = ref<(() => Promise<void>) | undefined>(undefined);
const handlePasswordEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
const uiStateId = ref<'enterId' | 'selectSignInMethod' | 'enterPasscode' | 'enterPassword' | undefined>(undefined);

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

onMounted(async () => {
    try {
        await constructFlow('login', ({ state }: { state: AnyState }) => {
            void safeHandleLoginFlowStateChange(state);
        });
        flowConstructed.value = true;
    } catch (error) {
        void reportAppError(new AppError('Failed to initialise sign in flow.', 'dpuse.AuthDialog.onMounted.constructFlow', { typeId: 'handled' }, { cause: error }));
    }
});

onUnmounted(() => {
    destroyFlow();
});

// ── Login flow helpers ───────────────────────────────────────────────────────────────────────────────────────────────

async function safeHandleLoginFlowStateChange(state: AnyState): Promise<void> {
    try {
        await handleLoginFlowStateChange(state);
    } catch (error) {
        void reportAppError(new AppError('Failed to handle sign in flow state change.', 'dpuse.AuthDialog.handleLoginFlowStateChange', { typeId: 'handled' }, { cause: error }));
    }
}

async function handleLoginFlowStateChange(state: AnyState): Promise<void> {
    switch (state.name) {
        case 'preflight':
            return;
        case 'login_init':
            handleLoginFlowInitState(state);
            return;
        case 'login_method_chooser':
            return handleLoginFlowMethodChooserState(state);
        case 'passcode_confirmation':
            handleLoginFlowPasscodeState(state);
            return;
        case 'login_password':
            handleLoginFlowPasswordState(state);
            return;
        case 'onboarding_create_passkey':
            return handleLoginFlowOnboardingCreatePasskeyState(state);
        case 'success':
            uiStateId.value = undefined;
            handleIdEntered.value = undefined;
            handlePasswordEntered.value = undefined;
            handlePasswordBack.value = undefined;
            destroyFlow();
            const query = { ...route.query };
            delete query.dlg;
            void router.push({ query });
            return;
        case 'error':
            console.log('STATE', 'error', state.error, state);
            return;
        default:
            console.log('UNEXPECTED STATE', state.name, state);
            return;
    }
}

function handleLoginFlowInitState(state: State<'login_init'>): void {
    const action = state.actions.continue_with_login_identifier as Action<ContinueWithLoginIdentifierInputs>;
    const input = action.inputs.email ?? action.inputs.identifier;
    if (!input) throw new Error('No sign in identifier or email.');
    uiStateId.value = 'enterId';
    handleIdEntered.value = async (identifier: string): Promise<void> => {
        const result = await action.run({ [input.name]: identifier });
        if (result.error) console.log(result.error, result);
        emailAddress.value = identifier;
    };
}

async function handleLoginFlowMethodChooserState(state: State<'login_method_chooser'>): Promise<void> {
    const action = uiStateId.value === undefined ? state.actions.back : state.actions.continue_to_password_login;
    if (!action) throw new Error('No password sign in action.');
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}

function handleLoginFlowPasscodeState(state: State<'passcode_confirmation'>): void {
    uiStateId.value = 'enterPasscode';
    // eslint-disable-next-line @typescript-eslint/require-await -- Code pending...
    handlePasswordEntered.value = async (parameter: unknown): Promise<void> => {
        console.log('PASSCODE', parameter);
    };
}

function handleLoginFlowPasswordState(state: State<'login_password'>): void {
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

async function handleLoginFlowOnboardingCreatePasskeyState(state: State<'onboarding_create_passkey'>): Promise<void> {
    const action = state.actions.skip;
    if (!action) throw new Error('No create passkey skip action.');
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}

// ── Transition helpers ───────────────────────────────────────────────────────────────────────────────────────────────

function onBeforeLeave(): void {
    const container = containerElement.value;
    if (!container) return;
    container.style.height = `${String(container.offsetHeight)}px`;
    container.style.overflow = 'hidden';
}

function onEnter(element: Element): void {
    const container = containerElement.value;
    if (!container) return;
    const newHeight = (element as HTMLElement).offsetHeight;
    container.style.transition = 'height 0.25s ease-in-out';
    void container.offsetHeight;
    container.style.height = `${String(newHeight)}px`;
}

function onAfterEnter(): void {
    const container = containerElement.value;
    if (!container) return;
    container.style.height = '';
    container.style.overflow = '';
    container.style.transition = '';
}
</script>

<template>
    <DialogLayout data-region="AuthDialog">
        <DialogModal variant="compact">
            <ScrollArea>
                <div class="flex flex-col gap-y-3 py-8 pr-4 pl-8">
                    <DPUseLogo class="size-12" />

                    <div ref="container">
                        <Transition name="fade" mode="out-in" @before-leave="onBeforeLeave" @enter="onEnter" @after-enter="onAfterEnter">
                            <LoginForm v-if="uiStateId === 'enterId' && handleIdEntered" :on-trigger="handleIdEntered" />

                            <PasswordForm
                                v-else-if="uiStateId === 'enterPassword' && handlePasswordEntered && handlePasswordBack"
                                :email-address="emailAddress"
                                @back="handlePasswordBack"
                                @submit="handlePasswordEntered"
                            />

                            <div v-else-if="flowConstructed">{{ t(T, 'Service_unavailable') }}</div>
                        </Transition>
                    </div>

                    <Separator class="mt-3 mb-2" />
                    <div class="text-center text-muted">{{ t(T, "Don't_have_an_account?") }} {{ t(T, 'Sign_up') }}</div>
                </div>
            </ScrollArea>
        </DialogModal>
    </DialogLayout>
</template>

<style scoped>
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
