<script setup lang="ts">
// Vendor dependencies.
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

// Global state dependencies.
import { useKnowledge } from '@/composables/useKnowledge';
import { useSessionStore } from '@/stores/sessionStore';

// Component dependencies.
import Button from '@/components/ui/button/Button.vue';

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
    <div class="bg-faint hidden w-18 flex-col border-r pt-14 md:flex">
        <!-- Options scroller. -->
        <div class="flex flex-1 flex-col items-center overflow-y-auto">
            <!-- Primary options. -->
            <div class="flex w-full flex-1 flex-col items-center pt-2">
                <Button v-for="option of activeBenchtopConfig.primaryOptions" :key="option.id" class="cursor-pointer" color="neutral" size="xl" square variant="ghost">
                    <BenchtopOptionIcon class="size-7" :option-id="option.id" :state="option.state" :state-values="optionStateValues" />
                </Button>
            </div>

            <!-- Secondary options and separator. -->
            <USeparator v-if="activeBenchtopConfig.secondaryOptions.length > 0" class="flex-none px-3 py-2" />
            <div class="flex w-full flex-none flex-col items-center pb-4">
                <Button
                    v-for="option of activeBenchtopConfig.secondaryOptions"
                    :key="option.id"
                    class="cursor-pointer"
                    color="neutral"
                    size="xl"
                    square
                    variant="ghost"
                    :to="{ name: option.id }"
                >
                    <BenchtopOptionIcon class="size-7" :option-id="option.id" :state="option.state" :state-values="optionStateValues" />
                </Button>
            </div>
        </div>
    </div>
</template>
