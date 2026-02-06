<script setup lang="ts">
// Vendor dependencies
import { ref, watch } from 'vue';

// Workbench core
import { useKnowledge } from '@/composables/useKnowledge';

// Components
import { LayoutDashboardIcon, LoaderCircleIcon, LogInIcon, UserCogIcon } from 'lucide-vue-next';

// Properties
const properties = defineProps<{ sessionIsAuthenticated?: boolean; onOptionSelect?: () => void }>();

const classes =
    'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 flex h-10 w-10 flex-none items-center justify-center rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-500';

const authIconState = ref<boolean | undefined>(undefined);

// Active localised benchtop configuration
const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en');

watch(
    () => properties.sessionIsAuthenticated,
    (newSessionIsAuthenticatedValue) => setTimeout(() => (authIconState.value = newSessionIsAuthenticatedValue), 300)
);

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleOptionSelect() {
    properties.onOptionSelect?.();
}
</script>

<template>
    <div class="flex h-full flex-col">
        <!-- Options scroller -->
        <div class="flex flex-1 flex-col items-center gap-y-2 overflow-y-auto overscroll-y-none border-t px-3 pt-2 pb-5.5">
            <div class="flex w-full flex-1 flex-col items-center">
                <RouterLink :aria-label="activeBenchtopConfig.label" :class="classes" :to="{ name: activeBenchtopConfig.id }" @click="handleOptionSelect">
                    <LayoutDashboardIcon aria-hidden="true" class="size-6" :stroke-width="1.25" />
                </RouterLink>

                <RouterLink
                    v-for="config of activeBenchtopConfig.options"
                    :key="config.id"
                    :aria-label="config.label"
                    :class="classes"
                    :to="{ name: config.id }"
                    @click="handleOptionSelect"
                >
                    <div aria-hidden="true" class="size-6" :style="{ color: `${config.color}` }" v-html="config.icon" />
                </RouterLink>
            </div>

            <RouterLink aria-label="Manage personal details" :class="classes" :to="{ name: 'managePersonalDetails' }" @click="handleOptionSelect">
                <div aria-hidden="true" class="relative size-6">
                    <TransitionGroup name="fade">
                        <UserCogIcon v-if="authIconState === true" key="user" class="absolute inset-0 size-6" :stroke-width="1.25" />
                        <LogInIcon v-if="authIconState === false" key="login" class="absolute inset-0 size-6" :stroke-width="1.25" />
                        <LoaderCircleIcon v-if="authIconState === undefined" key="loader" class="absolute inset-0 size-6 animate-spin text-neutral-300" />
                    </TransitionGroup>
                </div>
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
    will-change: opacity;
}
.fade-leave-active {
    transition: opacity 0.2s cubic-bezier(0.4, 0, 1, 1);
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
