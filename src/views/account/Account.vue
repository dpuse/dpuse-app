<script setup lang="ts">
// Vendor dependencies
import type { Action, AnyState, ContinueWithLoginIdentifierInputs, Input, State } from '@teamhanko/hanko-frontend-sdk';
import { nextTick, onMounted, onUnmounted, ref } from 'vue';

// Global state dependencies.
import { useSessionStore } from '@/stores/sessionStore';

import Button from '@/components/ui/button/Button.vue';
import LoginForm from '@/components/new-york-v4/blocks/login-05/components/LoginForm.vue';
import Separator from '@/components/ui/separator/Separator.vue';

const sessionState = useSessionStore();

const optionConfigs = [
    { id: 'profile', type: 'label', label: { en: 'Profile' } },
    { id: 'managePersonalDetails', icon: '', label: { en: 'Personal details' } },
    { id: 'manageSubscription', icon: '', label: { en: 'Subscription & billing' } },
    { id: 'managePreferences', icon: '', label: { en: 'Preferences' } },
    { id: 'security', type: 'label', label: { en: 'Security' } },
    { id: 'manageAccess', icon: '', label: { en: 'Access' } },
    { id: 'manageSessions', icon: '', label: { en: 'Active sessions' } },
    { id: 'reviewActivity', icon: '', label: { en: 'Recent activity' } },
    { id: 'integrations', type: 'label', label: { en: 'Integrations' } },
    { id: 'manageDataServiceTokens', icon: '', label: { en: 'Data service tokens' } },
    { id: 'development', type: 'label', label: { en: 'Development' } },
    { id: 'generateToken', icon: '', label: { en: 'API token' } }
];

const enterPasswordRef = ref<HTMLDivElement | null>(null);
const uiStateId = ref<'enterId' | 'enterPassword' | 'done'>('enterId');
const signInTriggerAction = ref<((identifier: string) => Promise<void>) | undefined>(undefined);

onMounted(() => sessionState.constructFlow('login', ({ state }: { state: AnyState }) => handleLoginFlowStateChange(state)));
onUnmounted(() => sessionState.destroyFlow());

const signOut = async () => {
    sessionState.destroyFlow();
    await sessionState.signOut();
    sessionState.constructFlow('login', ({ state }: { state: AnyState }) => handleLoginFlowStateChange(state));
};

// Handle login flow state change.
function handleLoginFlowStateChange(state: AnyState) {
    switch (state.name) {
        case 'preflight':
            return;
        case 'login_init':
            return handleLoginInitState(state);
        case 'login_method_chooser':
            return handleLoginMethodChooserState(state);
        case 'login_password':
            return handleLoginPasswordState(state);
        case 'onboarding_create_passkey':
            return handleOnboardingCreatePasskeyState(state);
        case 'success':
            uiStateId.value = 'done';
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

// Handle login flow initialisation state.
async function handleLoginInitState(state: State<'login_init'>) {
    const action = state.actions.continue_with_login_identifier as Action<ContinueWithLoginIdentifierInputs>;
    const input = (action.inputs.email || action.inputs.identifier) as Input<string>;
    console.log('input', input);
    uiStateId.value = 'enterId';
    // await nextTick();
    signInTriggerAction.value = async (identifier: string) => {
        const result = await action.run({ [input.name]: identifier });
        if (result.error) console.log(result.error, result);
    };
}

// Handle login flow method chooser state.
async function handleLoginMethodChooserState(state: State<'login_method_chooser'>) {
    const action = state.actions.continue_to_password_login!;
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}

// Handle login flow password state.
async function handleLoginPasswordState(state: State<'login_password'>) {
    const action = state.actions.password_login;
    uiStateId.value = 'enterPassword';
    await nextTick();
    enterPasswordRef.value!.onclick = async () => {
        const result = await action.run({ password: 'datapos1111' });
        if (result.error) console.log(result.error, result);
    };
}

// Handle login flow onboarding create passkey state.
async function handleOnboardingCreatePasskeyState(state: State<'onboarding_create_passkey'>) {
    const action = state.actions.skip!;
    const result = await action.run();
    if (result.error) console.log(result.error, result);
}
</script>

<template>
    <div class="bg-muted flex h-full flex-col items-center justify-center rounded-b-lg">
        <div v-if="sessionState.sessionStatus.isAuthenticated" class="bg-background flex w-full flex-1 flex-col overflow-y-hidden rounded-b-lg border-x border-b">
            <div class="px-4">
                <div class="flex h-14 w-full flex-none items-center border-b pl-4 text-lg font-light">Account</div>
            </div>

            <div class="flex flex-1 overflow-y-hidden">
                <div class="flex flex-none flex-col overflow-y-auto border-r p-4">
                    <div class="flex flex-1 flex-col gap-y-2">
                        <Button class="font-normal" variant="warning" @click="signOut">Sign out</Button>
                        <Separator class="mt-2" />

                        <template v-for="optionConfig of optionConfigs" :key="optionConfig.id">
                            <div v-if="optionConfig.type === 'label'" class="mt-2 text-xs text-[0.625rem] font-semibold uppercase">{{ optionConfig.label.en }}</div>
                            <RouterLink v-else :to="{ name: optionConfig.id }" as-child>
                                <Button class="w-full justify-start font-normal" :variant="optionConfig.id === 'deleteAccount' ? 'destructive' : 'secondary'">
                                    {{ optionConfig.label.en }}
                                </Button>
                            </RouterLink>
                        </template>
                    </div>

                    <div class="flex flex-none flex-col gap-y-2 pt-2">
                        <Separator class="my-2" />
                        <Button class="font-normal" variant="destructive" @click="sessionState.signOut()">Delete account</Button>
                    </div>
                </div>

                <div class="flex-1">
                    <RouterView />
                </div>
            </div>
        </div>

        <div v-else class="bg-background my-2 overflow-y-auto rounded-lg">
            <div v-if="uiStateId === 'enterId'">
                <LoginForm class="max-w-sm p-6 md:p-10" :on-trigger="signInTriggerAction" />
            </div>

            <button v-else-if="uiStateId === 'enterPassword'" ref="enterPasswordRef">Enter Password</button>
        </div>
    </div>
</template>
