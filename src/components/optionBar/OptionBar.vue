<script setup lang="ts">
// Vendor dependencies.
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';

// Global state dependencies.
import { useKnowledge } from '@/composables/useKnowledge';
import { useSessionStore } from '@/stores/sessionStore';

// Component dependencies.
import OptionIcon from '@/components/icon/Option.vue';
import Button from '@/components/ui/button/Button.vue';
import Separator from '@/components/ui/separator/Separator.vue';
import { HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { HoverCardRoot } from 'reka-ui';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Monitor, Moon, Sun } from 'lucide-vue-next';

const sessionState = useSessionStore();

// Active benchtop configuration state.
const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en') ?? {
    primaryOptions: [],
    secondaryOptions: []
};

// ???
const { sessionStatus } = storeToRefs(useSessionStore());
const optionStateValues = computed(() => ({ account: sessionStatus.value?.isAuthenticated }));

const preferencesHoverOpen = ref(false);
const closePreferencesHover = () => {
    preferencesHoverOpen.value = false;
};

// Sign out.
const signOut = async () => {
    sessionState.destroyFlow();
    await sessionState.signOut();
    closePreferencesHover();
};
</script>

<template>
    <div class="hidden w-16 flex-col pt-14 md:flex">
        <div class="px-3">
            <Separator />
        </div>

        <!-- Options scroller. -->
        <div class="flex flex-1 flex-col items-center overflow-y-auto pt-2 pb-5.5">
            <!-- Primary options. -->
            <div class="flex w-full flex-1 flex-col items-center gap-y-1">
                <RouterLink v-for="optionConfig of activeBenchtopConfig.primaryOptions" :key="optionConfig.id" :to="{ name: optionConfig.id }" as-child>
                    <Button size="icon-lg" variant="ghost">
                        <OptionIcon class="size-6" :option-id="optionConfig.id" :state="optionConfig.state" :state-values="optionStateValues" />
                    </Button>
                </RouterLink>
            </div>

            <div class="w-full flex-none px-3 py-2">
                <Separator />
            </div>

            <!-- Secondary options and separator. -->
            <div class="flex w-full flex-none flex-col items-center gap-y-1">
                <template v-for="optionConfig of activeBenchtopConfig.secondaryOptions" :key="optionConfig.id">
                    <div v-if="optionConfig.state.kind === 'multiple'">
                        <HoverCardRoot v-model:open="preferencesHoverOpen" :close-delay="0" :open-delay="0">
                            <HoverCardTrigger>
                                <Button size="icon-lg" variant="ghost">
                                    <OptionIcon class="size-6" :option-id="optionConfig.id" :state="optionConfig.state" :state-values="optionStateValues" />
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
                                            <Button size="icon-sm" variant="secondary"><Moon /></Button>
                                            <Button size="icon-sm" variant="ghost"><Sun /></Button>
                                            <Button size="icon-sm" variant="ghost"><Monitor /></Button>
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
                        </HoverCardRoot>
                    </div>

                    <RouterLink v-else :to="{ name: optionConfig.id }" as-child>
                        <Button size="icon-lg" variant="ghost">
                            <OptionIcon class="size-6" :option-id="optionConfig.id" :state="optionConfig.state" :state-values="optionStateValues" />
                        </Button>
                    </RouterLink>
                </template>
            </div>
        </div>
    </div>
</template>
