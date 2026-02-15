<script setup lang="ts">
// External dependencies
import { computed, ref, watch } from 'vue';
import { LoaderCircleIcon, LogInIcon, UserCogIcon } from 'lucide-vue-next';
import { RouterLink, useRouter } from 'vue-router';

// Workbench core
import type { BenchtopOptionLocalisedConfig } from '~/src/types/workbench';

// Workbench components
import IconActionContent from '../../base/IconActionContent.vue';

// Properties
const properties = defineProps<{ sessionIsAuthenticated?: boolean; onSelect: (config?: BenchtopOptionLocalisedConfig) => void }>();

// Global state
const router = useRouter();

const authIconState = ref<boolean | undefined>(undefined);

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

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleSelect(): void {
    if (!properties.sessionIsAuthenticated) router.replace({ query: { ...router.currentRoute.value.query, dialog: 'auth' } });
    properties.onSelect();
}
</script>

<template>
    <component :is="optionComponent" aria-label="Manage personal details" class="group outline-none" v-bind="optionAttributes" @click="handleSelect">
        <IconActionContent aria-hidden="true" class="relative h-10 w-10">
            <TransitionGroup name="fade">
                <UserCogIcon v-if="authIconState === true" key="user" class="absolute top-2 left-2 size-6" :stroke-width="1.25" />
                <LogInIcon v-if="authIconState === false" key="login" class="absolute top-2 left-2 size-6" :stroke-width="1.25" />
                <LoaderCircleIcon v-if="authIconState === undefined" key="loader" class="absolute top-2 left-2 size-6 animate-spin text-neutral-300" />
            </TransitionGroup>
        </IconActionContent>
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
