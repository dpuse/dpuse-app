<script setup lang="ts">
// Vendor dependencies
// import type { Action, AnyState, ContinueWithLoginIdentifierInputs, Input, State } from '@teamhanko/hanko-frontend-sdk';
// import { onMounted, onUnmounted, ref } from 'vue';

// Application modules
import { useSessionStore } from '@/stores/sessionStore';

// Properties
type Properties = { isDisplayWide: boolean };
const properties = defineProps<Properties>();

import Button from '@/components/base/button/Button.vue';
import Header from '@/components/block/header/Header.vue';
// import LoginForm from '@/components/block/account/LoginForm.vue';
// import PasswordForm from '@/components/block/account/PasswordForm.vue';
import Separator from '@/components/base/separator/Separator.vue';

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

// const handleIdEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
// const handlePasswordEntered = ref<((identifier: string) => Promise<void>) | undefined>(undefined);
// const uiStateId = ref<'enterId' | 'enterPassword' | 'done'>('enterId');

// onMounted(async () => {
//     if (sessionState.sessionStatus.isAuthenticated) return;
//     sessionState.constructFlow('login', ({ state }: { state: AnyState }) => handleLoginFlowStateChange(state));
// });
// onUnmounted(() => sessionState.destroyFlow());

// Sign out.
const signOut = async () => {
    // sessionState.destroyFlow();
    await sessionState.signOut();
    // sessionState.constructFlow('login', ({ state }: { state: AnyState }) => handleLoginFlowStateChange(state));
};

// // Handle login flow state change.
// function handleLoginFlowStateChange(state: AnyState) {
//     switch (state.name) {
//         case 'preflight':
//             return;
//         case 'login_init':
//             return handleLoginFlowInitState(state);
//         case 'login_method_chooser':
//             return handleLoginFlowMethodChooserState(state);
//         case 'login_password':
//             return handleLoginFlowPasswordState(state);
//         case 'onboarding_create_passkey':
//             return handleLoginFlowOnboardingCreatePasskeyState(state);
//         case 'success':
//             uiStateId.value = 'done';
//             handleIdEntered.value = undefined;
//             handlePasswordEntered.value = undefined;
//             // sessionState.destroyFlow();
//             return;
//         case 'error':
//             console.log('STATE', 'error', state.error, state);
//             return;
//         default:
//             console.log('UNEXPECTED STATE', state.name, state);
//             return;
//     }
// }

// // Handle login flow initialisation state. User identifier (email address) input is required.
// async function handleLoginFlowInitState(state: State<'login_init'>) {
//     const action = state.actions.continue_with_login_identifier as Action<ContinueWithLoginIdentifierInputs>;
//     const input = (action.inputs.email || action.inputs.identifier) as Input<string>;
//     uiStateId.value = 'enterId';
//     handleIdEntered.value = async (identifier: string) => {
//         const result = await action.run({ [input.name]: identifier });
//         if (result.error) console.log(result.error, result);
//     };
// }

// // Handle login flow method chooser state. Only password logins are support.
// async function handleLoginFlowMethodChooserState(state: State<'login_method_chooser'>) {
//     const action = state.actions.continue_to_password_login!;
//     const result = await action.run();
//     if (result.error) console.log(result.error, result);
// }

// // Handle login flow password state. Password input is required.
// async function handleLoginFlowPasswordState(state: State<'login_password'>) {
//     const action = state.actions.password_login;
//     uiStateId.value = 'enterPassword';
//     handlePasswordEntered.value = async (password: string) => {
//         const result = await action.run({ password });
//         if (result.error) console.log(result.error, result);
//     };
// }

// // Handle login flow onboarding create passkey state. Creation of passkeys is disabled.
// async function handleLoginFlowOnboardingCreatePasskeyState(state: State<'onboarding_create_passkey'>) {
//     const action = state.actions.skip!;
//     const result = await action.run();
//     if (result.error) console.log(result.error, result);
// }
</script>

<template>
    <div class="bg-muted flex h-full flex-col items-center justify-center rounded-b-lg">
        <div class="bg-background flex w-full flex-1 flex-col overflow-y-hidden rounded-b-lg border-x border-b">
            <Header title="Account" :is-display-wide="properties.isDisplayWide" />

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
                        <RouterLink :to="{ name: 'deleteAccount' }" as-child>
                            <Button class="w-full font-normal" variant="destructive">Delete account</Button>
                        </RouterLink>
                    </div>
                </div>

                <div class="flex-1">
                    <RouterView />
                </div>
            </div>
        </div>
        <!--
        <div v-else class="bg-background my-2 overflow-y-auto rounded-lg">
            <div v-if="uiStateId === 'enterId' && handleIdEntered">
                <LoginForm class="max-w-sm min-w-sm p-6 md:p-10" :on-trigger="handleIdEntered" />
            </div>

            <div v-if="uiStateId === 'enterPassword' && handlePasswordEntered">
                <PasswordForm class="max-w-sm min-w-sm p-6 md:p-10" :on-trigger="handlePasswordEntered" />
            </div>
        </div> -->
    </div>
</template>
