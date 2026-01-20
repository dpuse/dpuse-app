<script setup lang="ts">
// Vendor dependencies.
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

// Global state dependencies.
import { useKnowledge } from '@/composables/useKnowledge';
import { useSessionStore } from '@/stores/sessionStore';

// Component dependencies.
import OptionIcon from '@/components/icon/Option.vue';
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
    <div class="hidden w-16 flex-col pt-14 md:flex">
        <!-- Options scroller. -->
        <div class="flex flex-1 flex-col items-center overflow-y-auto">
            <!-- Primary options. -->
            <div class="flex w-full flex-1 flex-col items-center">
                <router-link v-for="optionConfig of activeBenchtopConfig.primaryOptions" :key="optionConfig.id" :to="{ name: optionConfig.id }" as-child>
                    <Button size="icon-lg" variant="ghost">
                        <OptionIcon class="size-6" :option-id="optionConfig.id" :state="optionConfig.state" :state-values="optionStateValues" />
                    </Button>
                </router-link>
            </div>

            <!-- Secondary options and separator. -->
            <div class="flex w-full flex-none flex-col items-center">
                <router-link v-for="optionConfig of activeBenchtopConfig.secondaryOptions" :key="optionConfig.id" :to="{ name: optionConfig.id }" as-child>
                    <Button size="icon-lg" variant="ghost">
                        <OptionIcon class="size-6" :option-id="optionConfig.id" :state="optionConfig.state" :state-values="optionStateValues" />
                    </Button>
                </router-link>
            </div>
        </div>
    </div>
</template>
