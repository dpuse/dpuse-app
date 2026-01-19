<script setup lang="ts">
// Vendor dependencies.
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

// Global state dependencies.
import { useKnowledge } from '@/composables/useKnowledge';
import { useSessionStore } from '@/stores/sessionStore';

// Component dependencies.
import OptionIcon from '@/components/icon/OptionIcon.vue';
import Button from '@/components/ui/button/Button.vue';
import Separator from '@/components/ui/separator/Separator.vue';

// Active benchtop configuration state.
const activeBenchtopConfig = useKnowledge().getBenchtopConfig('workflow', 'en') ?? {
    primaryOptions: [],
    secondaryOptions: []
};

// ???
const { sessionStatus } = storeToRefs(useSessionStore());
const optionStateValues = computed(() => ({ account: sessionStatus.value?.isAuthenticated }));
</script>

<template>
    <div class="bg-faint hidden w-16 flex-col border-r pt-14 md:flex">
        <Separator />

        <!-- Options scroller. -->
        <div class="flex flex-1 flex-col items-center overflow-y-auto">
            <!-- Primary options. -->
            <div class="flex w-full flex-1 flex-col items-center pt-2">
                <router-link v-for="option of activeBenchtopConfig.primaryOptions" :key="option.id" :to="{ name: option.id }" as-child>
                    <Button size="icon-lg" variant="ghost">
                        <OptionIcon class="size-6" :option-id="option.id" :state="option.state" :state-values="optionStateValues" />
                    </Button>
                </router-link>
            </div>

            <!-- Secondary options and separator. -->
            <Separator v-if="activeBenchtopConfig.secondaryOptions.length > 0" class="my-2 flex-none" />
            <div class="flex w-full flex-none flex-col items-center pb-4">
                <router-link v-for="option of activeBenchtopConfig.secondaryOptions" :key="option.id" :to="{ name: option.id }" as-child>
                    <Button size="icon-lg" variant="ghost">
                        <OptionIcon class="size-6" :option-id="option.id" :state="option.state" :state-values="optionStateValues" />
                    </Button>
                </router-link>
            </div>
        </div>
    </div>
</template>
