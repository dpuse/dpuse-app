<script setup lang="ts">
// Vendor dependencies
import { computed, ref, watch } from 'vue';
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

const optionComponent = computed(() => (properties.sessionIsAuthenticated ? RouterLink : 'button'));
const optionAttributes = computed(() => (properties.sessionIsAuthenticated ? { to: { name: 'account' } } : { type: 'button' }));

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

function handleSelect() {
    if (!properties.sessionIsAuthenticated) router.replace({ query: { ...router.currentRoute.value.query, dialog: 'auth' } });
    properties.onSelect();
}
</script>

<template>
    <component :is="optionComponent" aria-label="Manage personal details" :class="CLASSES" v-bind="optionAttributes" @click="handleSelect">
        <div aria-hidden="true" class="relative size-6">
            <TransitionGroup name="fade">
                <UserCogIcon v-if="authIconState === true" key="user" class="absolute inset-0 size-6" :stroke-width="1.25" />
                <LogInIcon v-if="authIconState === false" key="login" class="absolute inset-0 size-6" :stroke-width="1.25" />
                <LoaderCircleIcon v-if="authIconState === undefined" key="loader" class="absolute inset-0 size-6 animate-spin text-neutral-300" />
            </TransitionGroup>
        </div>
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
