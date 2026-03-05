<script setup lang="ts">
// External Dependencies
import { useRouter } from 'vue-router';
import { computed, defineAsyncComponent, onMounted, ref, watch } from 'vue';
import { LoaderCircleIcon, UserCogIcon } from 'lucide-vue-next';

// App Core
import { useSessionStore } from '@/stores/sessionStore';

// App Components
import ActionButton from '@/components/action/ActionButton.vue';
// import ActionRouterLink from '@/components/action/ActionRouterLink.vue';
import Separator from '@/components/separator/Separator.vue';

// App Components (lazy loaded)
const SessionMenu = defineAsyncComponent(() => import('@/components/session/SessionMenu.vue'));

// Properties
const { sessionIsAuthenticated } = defineProps<{ sessionIsAuthenticated?: boolean }>();

// Emits
const emit = defineEmits<{ (event: 'click'): void }>();

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const router = useRouter();

// ??? ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const authIconState = ref<boolean | undefined>(undefined);

const optionComponent = computed(() => (sessionIsAuthenticated ? ActionButton : ActionButton));
// const optionAttributes = computed(() => (sessionIsAuthenticated ? { to: { name: 'account' } } : undefined));

const sessionPanelIsVisible = ref(false);

const error = ref(false);
watch(
    () => sessionIsAuthenticated,
    (newSessionIsAuthenticatedValue, oldSessionIsAuthenticatedValue) => {
        if (oldSessionIsAuthenticatedValue === undefined) {
            setTimeout(() => (authIconState.value = newSessionIsAuthenticatedValue), 200);
            return;
        }
        authIconState.value = newSessionIsAuthenticatedValue;
    },
    { immediate: true }
);

// Lifecycle Event Handlers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// UI Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function handleSelect(): void {
    if (!sessionIsAuthenticated) router.replace({ query: { ...router.currentRoute.value.query, dialog: 'auth' } });
    emit('click');
}
</script>

<template>
    <div class="flex flex-col gap-y-3">
        <SessionMenu v-if="sessionPanelIsVisible" class="fixed top-4 bottom-19.25 left-3" />
        <Separator />
        <component :is="optionComponent" aria-label="Manage personal details" class="relative h-10 w-10" variant="avatar" @click="handleSelect">
            <TransitionGroup name="fade">
                <div v-if="authIconState === true" class="absolute top-0.5 left-0.5 rounded-full" @click="sessionPanelIsVisible = !sessionPanelIsVisible">
                    <img v-if="!error" class="size-9 rounded-full" :src="avatarUrl" @error="error = true" />
                    <svg v-else viewBox="0 0 24 24" fill="currentColor" class="size-9 rounded-full text-zinc-400/60">
                        <path
                            fill-rule="evenodd"
                            d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                            clip-rule="evenodd"
                        />
                    </svg>
                </div>
                <UserCogIcon v-if="authIconState === false" key="login" class="absolute top-2 left-2" :stroke-width="1.25" />
                <LoaderCircleIcon v-if="authIconState === undefined" key="loader" class="absolute top-2 left-2 animate-spin text-neutral-300" />
            </TransitionGroup>
        </component>
    </div>
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
