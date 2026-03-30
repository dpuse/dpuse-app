<script setup lang="ts">
// External Dependencies
import { shallowRef } from 'vue';

// App Core
import { useDisplayBreakpoint } from '@/composables/useDisplayBreakpoint';

// Properties & Emits
const { maxRightWidth } = defineProps<{ maxRightWidth?: string }>();

const { displayIsWide } = useDisplayBreakpoint();

const activeOptionConfig = shallowRef<object | undefined>();
</script>

<template>
    <div class="flex">
        <div v-if="displayIsWide || !activeOptionConfig" class="flex flex-1 flex-col">
            <slot name="left" />
        </div>

        <div v-if="displayIsWide || activeOptionConfig" class="flex flex-1 flex-col" :style="{ maxWidth: maxRightWidth != null ? maxRightWidth : undefined }">
            <slot name="right" />
        </div>
    </div>
</template>
