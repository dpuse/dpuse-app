<script setup lang="ts">
// External dependencies
import { useRouter } from 'vue-router';
import { computed, onMounted, ref, watch } from 'vue';
import { LoaderCircleIcon, LogInIcon, UserCogIcon } from 'lucide-vue-next';

// App core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';
import { useSessionStore } from '@/stores/sessionStore';

// App components
import ActionButton from '@/components/action/ActionButton.vue';
import ActionRouterLink from '@/components/action/ActionRouterLink.vue';

// Properties
const properties = defineProps<{ sessionIsAuthenticated?: boolean; onSelect: (config?: BenchtopOptionLocalisedConfig) => void }>();

// Global state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const router = useRouter();

// ??? ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const authIconState = ref<boolean | undefined>(undefined);

const optionComponent = computed(() => (properties.sessionIsAuthenticated ? ActionRouterLink : ActionButton));
const optionAttributes = computed(() => (properties.sessionIsAuthenticated ? { to: { name: 'account' } } : undefined));

const sessionPanelIsVisible = ref(false);
const error = ref(false);
watch(
    () => properties.sessionIsAuthenticated,
    (newSessionIsAuthenticatedValue, oldSessionIsAuthenticatedValue) => {
        if (oldSessionIsAuthenticatedValue === undefined) {
            setTimeout(() => (authIconState.value = newSessionIsAuthenticatedValue), 200);
            return;
        }
        authIconState.value = newSessionIsAuthenticatedValue;
    },
    { immediate: true }
);

// Lifecycle event handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const avatarUrl = ref('');

async function gravatarUrl(email: string, size: number): Promise<string> {
    const normalized = email.trim().toLowerCase();

    const data = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    const hashArray = [...new Uint8Array(hashBuffer)];
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return `https://gravatar.com/avatar/${hashHex}?s=${size}&d=404`;
}

onMounted(async () => {
    useSessionStore().initialiseServices();
    avatarUrl.value = await gravatarUrl('terrell.jm@gmail.com', 40);
});

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleSelect(): void {
    if (!properties.sessionIsAuthenticated) router.replace({ query: { ...router.currentRoute.value.query, dialog: 'auth' } });
    properties.onSelect();
}
</script>

<template>
    <component :is="optionComponent" aria-label="Manage personal details" class="relative h-10 w-10" variant="avatar" v-bind="optionAttributes" @click="handleSelect">
        <TransitionGroup name="fade">
            <div v-if="authIconState === true" class="absolute top-0 left-0 rounded-full p-px" @click="sessionPanelIsVisible = !sessionPanelIsVisible">
                <img v-if="!error" class="rounded-full" :src="avatarUrl" @error="error = true" />
                <svg v-else viewBox="0 0 24 24" fill="currentColor" class="h-[38px] w-[38px] rounded-full text-yellow-400">
                    <path
                        fill-rule="evenodd"
                        d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                        clip-rule="evenodd"
                    />
                </svg>
            </div>
            <!-- <UserCogIcon v-if="authIconState === true" key="user" class="absolute top-2 left-2" :stroke-width="1.25" /> -->
            <LogInIcon v-if="authIconState === false" key="login" class="absolute top-2 left-2" :stroke-width="1.25" />
            <LoaderCircleIcon v-if="authIconState === undefined" key="loader" class="absolute top-2 left-2 animate-spin text-neutral-300" />
        </TransitionGroup>
    </component>
</template>

<style scoped>
.fade-enter-active {
    transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1) 0.25s;
    will-change: opacity;
}
.fade-leave-active {
    transition: opacity 0.5s cubic-bezier(0.4, 0, 1, 1);
    will-change: opacity;
}
@media (prefers-reduced-motion: reduce) {
    .fade-enter-active,
    .fade-leave-active {
        transition: none;
    }
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
