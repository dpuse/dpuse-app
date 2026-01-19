<script setup lang="ts">
import BrandIcon from '@/components/brand/BrandIcon.vue';

type Properties = { compact?: boolean };
const { compact = false } = defineProps<Properties>();
</script>

<template>
    <div class="flex">
        <!-- Icon -->
        <BrandIcon class="size-7" />

        <!-- Wording -->
        <div class="text-sm leading-none font-semibold">
            <!-- eslint-disable vue/no-bare-strings-in-template -->
            <div class="mt-1 text-[rgb(235,187,72)]">
                os<Transition name="fade">
                    <span v-if="!compact">itioning</span>
                </Transition>
            </div>
            <div class="-mt-0.5 -ml-2 text-[rgb(114,155,27)]">ata</div>
            <!-- eslint-enable vue/no-bare-strings-in-template -->
        </div>
    </div>
</template>
