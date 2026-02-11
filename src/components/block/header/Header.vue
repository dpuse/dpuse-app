<script setup lang="ts">
// External dependencies
import { computed } from 'vue';

// Properties
const properties = defineProps<{ isAssistPanelOpenInWideDisplay: boolean; isWideDisplay: boolean; title: string }>();

// Title indented from left when screen is compact, to allow for brand logo
// Title indented from right when screen is wide and assistant panel is not open, to allow for assistant icon
const titlePadding = computed(() => ({
    paddingLeft: properties.isWideDisplay ? undefined : '2.5rem',
    paddingRight: properties.isAssistPanelOpenInWideDisplay ? undefined : '3.5rem'
}));
</script>

<template>
    <div class="flex-none px-4">
        <div class="border-separator flex h-14 items-center border-b text-lg font-light" :style="titlePadding">
            <div class="truncate">
                {{ title }}
            </div>
        </div>
    </div>
</template>
