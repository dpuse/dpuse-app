<script setup lang="ts">
// External dependencies
import { useRouter } from 'vue-router';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { LoaderCircleIcon, LogInIcon, UserCogIcon } from 'lucide-vue-next';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/vue';

// App core
import type { BenchtopOptionLocalisedConfig } from '@/types/workbench';

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

// Panel position ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const buttonReference = ref<HTMLDivElement | null>(null);
const panelReference = ref<HTMLDivElement | null>(null);
const panelStyle = ref<Record<string, string>>({});

function updatePanelPosition(): void {
    const element = buttonReference.value;
    if (element === null) return;
    const rect = element.getBoundingClientRect();
    panelStyle.value = {
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 8}px`,
        left: `${rect.left}px`
    };
}

onMounted(() => {
    updatePanelPosition();
    window.addEventListener('scroll', updatePanelPosition, true);
    window.addEventListener('resize', updatePanelPosition);
});

onUnmounted(() => {
    window.removeEventListener('scroll', updatePanelPosition, true);
    window.removeEventListener('resize', updatePanelPosition);
});

// Panel focus ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleButtonTab(event: KeyboardEvent): void {
    if (event.shiftKey) return;
    const firstFocusable = panelReference.value?.querySelector<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable === undefined || firstFocusable === null) return;
    event.preventDefault();
    firstFocusable.focus();
}

// UI helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleSelect(): void {
    // if (!properties.sessionIsAuthenticated) router.replace({ query: { ...router.currentRoute.value.query, dialog: 'auth' } });
    // properties.onSelect();
}
</script>

<template>
    <Popover>
        <div ref="buttonReference">
            <PopoverButton @click="updatePanelPosition" @keydown.tab="handleButtonTab">
                <component :is="optionComponent" aria-label="Manage personal details" class="relative h-10 w-10" v-bind="optionAttributes" @click="handleSelect">
                    <TransitionGroup name="fade">
                        <UserCogIcon v-if="authIconState === true" key="user" class="absolute top-2 left-2" :stroke-width="1.25" />
                        <LogInIcon v-if="authIconState === false" key="login" class="absolute top-2 left-2" :stroke-width="1.25" />
                        <LoaderCircleIcon v-if="authIconState === undefined" key="loader" class="absolute top-2 left-2 animate-spin text-neutral-300" />
                    </TransitionGroup>
                </component>
            </PopoverButton>
        </div>

        <PopoverPanel :style="panelStyle" class="z-50 rounded-md border border-zinc-300 bg-zinc-100 px-4 py-2">
            <div ref="panelReference" class="flex flex-col">
                <a href="/analytics">Analytics</a>
                <a href="/engagement">Engagement</a>
                <a href="/security">Security</a>
                <a href="/integrations">Integrations</a>
            </div>

            <!-- <img src="/solutions.jpg" alt="" /> -->
        </PopoverPanel>
    </Popover>
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
