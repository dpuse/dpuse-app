<script setup lang="ts">
// External dependencies
import { computed } from 'vue';
// import { storeToRefs } from 'pinia';

// Application modules
import { useKnowledge } from '@/composables/useKnowledge';
// import { useSessionStore } from '@/stores/sessionStore';

// Components and icons
import Button from '@/components/base/button/Button.vue';
// import { HoverCardRoot } from 'reka-ui';
// import { Label } from '@/components/base/label';
import OptionIcon from '@/components/icon/OptionIcon.vue';
import Separator from '@/components/base/separator/Separator.vue';
// import { Switch } from '@/components/base/switch';
// import { HoverCardContent, HoverCardTrigger } from '@/components/base/hover-card';
// import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-vue-next';

// Properties
type Properties = { class?: string; sessionIsAuthenticated?: boolean; onOptionSelect?: () => void };
const properties = defineProps<Properties>();

function handleOptionSelect() {
    properties.onOptionSelect?.();
}

// Global state
// const sessionState = useSessionStore();
// const { sessionStatus } = storeToRefs(sessionState);
// const sessionStatus = ref({ isAuthenticated: false });

// Active benchtop configuration ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en') ?? { primaryOptions: [], secondaryOptions: [] };

// Option kind values state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const optionKindValues = computed(() => ({ account: properties.sessionIsAuthenticated }));

// Quick links panel state ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// const isQuickLinksPanelOpen = ref(false);

// function closeQuickLinksPanel() {
//     isQuickLinksPanelOpen.value = false;
// }

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// async function signOut() {
//     sessionState.destroyFlow();
//     await sessionState.signOut();
//     closeQuickLinksPanel();
// }
</script>

<template>
    <div :class="['flex h-full flex-col', properties.class]">
        <!-- Top scroll boundary -->
        <div class="px-3"><Separator /></div>

        <!-- Options scroller -->
        <div class="flex flex-1 flex-col items-center overflow-y-auto overscroll-y-none pt-2 pb-5.5">
            <!-- Primary options -->
            <div class="flex w-full flex-1 flex-col items-center gap-y-1">
                <RouterLink v-for="optionConfig of activeBenchtopConfig.primaryOptions" :key="optionConfig.id" :to="{ name: optionConfig.id }" as-child>
                    <Button size="icon-lg" variant="ghost" @click="handleOptionSelect">
                        <OptionIcon class="size-6" :option-id="optionConfig.id" :kind="optionConfig.kind" :option-kind-values="optionKindValues" />
                    </Button>
                </RouterLink>
            </div>

            <!-- Secondary options and separator -->
            <div class="w-full flex-none px-3 py-2"><Separator /></div>
            <div class="flex w-full flex-none flex-col items-center gap-y-1">
                <template v-for="optionConfig of activeBenchtopConfig.secondaryOptions" :key="optionConfig.id">
                    <div v-if="optionConfig.kind.id === 'multiple'">
                        <!-- <HoverCardRoot v-model:open="isQuickLinksPanelOpen" :close-delay="0" :open-delay="0">
                            <HoverCardTrigger>
                                <Button size="icon-lg" variant="ghost">
                                    <OptionIcon class="size-6" :option-id="optionConfig.id" :kind="optionConfig.kind" :option-kind-values="optionKindValues" />
                                </Button>
                            </HoverCardTrigger>
                            <HoverCardContent align="end" side="right">
                                <div class="flex flex-none flex-col gap-y-4">
                                    <div>
                                        <div class="mb-1 text-xs text-[0.625rem] font-bold uppercase">Display</div>
                                        <div class="flex h-8 items-center space-x-2">
                                            <Switch id="full-screen-mode" />
                                            <Label for="full-screen-mode">Full screen</Label>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="mb-1 text-xs text-[0.625rem] font-bold uppercase">Appearance</div>
                                        <div class="flex h-8 items-center space-x-2">
                                            <Button size="icon-sm" variant="secondary"><MoonIcon /></Button>
                                            <Button size="icon-sm" variant="ghost"><SunIcon /></Button>
                                            <Button size="icon-sm" variant="ghost"><MonitorIcon /></Button>
                                        </div>
                                    </div>

                                    <div>
                                        <div class="mb-1 text-xs text-[0.625rem] font-bold uppercase">Language</div>
                                        <div class="bg-muted flex h-8 items-center space-x-2 rounded-md"></div>
                                    </div>

                                    <div>
                                        <div class="mb-1 text-xs text-[0.625rem] font-bold uppercase">Locale</div>
                                        <div class="bg-muted flex h-8 items-center space-x-2 rounded-md"></div>
                                    </div>

                                    <div>
                                        <div class="mb-1 text-xs text-[0.625rem] font-bold uppercase">Time zone</div>
                                        <div class="bg-muted flex h-8 items-center rounded-md"></div>
                                    </div>

                                    <div>
                                        <Separator class="mb-3" />
                                        <Button class="w-full font-normal" :disabled="!sessionState.sessionStatus.isAuthenticated" variant="warning" @click="signOut">
                                            Sign out
                                        </Button>
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCardRoot> -->
                    </div>

                    <RouterLink v-else :to="{ name: optionConfig.id }" as-child>
                        <Button size="icon-lg" variant="ghost" @click="handleOptionSelect">
                            <OptionIcon class="size-6" :option-id="optionConfig.id" :kind="optionConfig.kind" :option-kind-values="optionKindValues" />
                        </Button>
                    </RouterLink>
                </template>
            </div>
        </div>
    </div>
</template>
