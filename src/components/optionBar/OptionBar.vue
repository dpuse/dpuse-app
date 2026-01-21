<script setup lang="ts">
// Vendor dependencies.
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

// Global state dependencies.
import { useKnowledge } from '@/composables/useKnowledge';
import { useSessionStore } from '@/stores/sessionStore';

// Component dependencies.
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import OptionIcon from '@/components/icon/Option.vue';
import Button from '@/components/ui/button/Button.vue';
import Separator from '@/components/ui/separator/Separator.vue';
import type { BenchtopOptionState } from '~/src/types/workbench';

// Active benchtop configuration state.
const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en') ?? {
    primaryOptions: [],
    secondaryOptions: []
};

// ???
const { sessionStatus } = storeToRefs(useSessionStore());
const optionStateValues = computed(() => ({ account: sessionStatus.value?.isAuthenticated }));

const settingsState: BenchtopOptionState = {
    kind: 'single',
    single: {
        colors: { text: { light: '#7d7974' } },
        icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.25' stroke-linecap='round' stroke-linejoin='round'><path d='M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915'/><circle cx='12' cy='12' r='3'/></svg>"
    }
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
            <div class="flex w-full flex-1 flex-col items-center">
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
            <div class="flex w-full flex-none flex-col items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <OptionIcon class="size-6" option-id="settings" :state="settingsState" :state-values="optionStateValues" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Billing</DropdownMenuItem>
                        <DropdownMenuItem>Team</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Full Screen</DropdownMenuLabel>
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Billing</DropdownMenuItem>
                        <DropdownMenuItem>Team</DropdownMenuItem>
                        <DropdownMenuItem>Subscription</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <!-- Secondary options and separator. -->
            <div class="flex w-full flex-none flex-col items-center">
                <RouterLink v-for="optionConfig of activeBenchtopConfig.secondaryOptions" :key="optionConfig.id" :to="{ name: optionConfig.id }" as-child>
                    <Button size="icon-lg" variant="ghost">
                        <OptionIcon class="size-6" :option-id="optionConfig.id" :state="optionConfig.state" :state-values="optionStateValues" />
                    </Button>
                </RouterLink>
            </div>
        </div>
    </div>
</template>
