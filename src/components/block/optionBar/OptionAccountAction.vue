<script setup lang="ts">
// Vendor dependencies
import { ref, watch } from 'vue';
import { LoaderCircleIcon, LogInIcon, UserCogIcon } from 'lucide-vue-next';
import { RouterLink, useRouter } from 'vue-router';

// Global state
const router = useRouter();

// Properties
const properties = defineProps<{ sessionIsAuthenticated?: boolean; onSelect: () => void }>();

// Constants
const CLASSES =
    'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 flex h-10 w-10 flex-none items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500';

const authIconState = ref<boolean | undefined>(properties.sessionIsAuthenticated);

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

function handleSelectAuthenticated() {
    properties.onSelect();
}

function handleSelectUnauthenticated() {
    properties.onSelect();
    router.replace({ query: { ...router.currentRoute.value.query, dialog: 'auth' } });
}
</script>

<template>
    <RouterLink v-if="properties.sessionIsAuthenticated" aria-label="Manage personal details" :class="CLASSES" :to="{ name: 'managePersonalDetails' }" @click="handleSelectAuthenticated">
        <div aria-hidden="true" class="relative size-6">
            <TransitionGroup name="fade">
                <UserCogIcon v-if="authIconState === true" key="user" class="absolute inset-0 size-6" :stroke-width="1.25" />
                <LogInIcon v-if="authIconState === false" key="login" class="absolute inset-0 size-6" :stroke-width="1.25" />
                <LoaderCircleIcon v-if="authIconState === undefined" key="loader" class="absolute inset-0 size-6 animate-spin text-neutral-300" />
            </TransitionGroup>
        </div>
    </RouterLink>

    <button v-else aria-label="Manage personal details" :class="CLASSES" type="button" @click="handleSelectUnauthenticated">
        <div aria-hidden="true" class="relative size-6">
            <TransitionGroup name="fade">
                <UserCogIcon v-if="authIconState === true" key="user" class="absolute inset-0 size-6" :stroke-width="1.25" />
                <LogInIcon v-if="authIconState === false" key="login" class="absolute inset-0 size-6" :stroke-width="1.25" />
                <LoaderCircleIcon v-if="authIconState === undefined" key="loader" class="absolute inset-0 size-6 animate-spin text-neutral-300" />
            </TransitionGroup>
        </div>
    </button>
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
