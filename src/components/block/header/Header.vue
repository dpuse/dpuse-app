<script setup lang="ts">
// Vendor dependencies
import { computed } from 'vue';

// Properties
const properties = defineProps<{ isDisplayWide: boolean; title: string }>();

// Header offsets
const headerOffsets = computed(() => ({
    paddingLeft: properties.isDisplayWide ? undefined : '2.5rem',
    paddingRight: properties.isDisplayWide ? '2.5rem' : '2.5rem'
}));
</script>

<template>
    <div class="flex-none px-4">
        <div class="flex h-14 items-center border-b text-lg font-light" :style="headerOffsets">
            <div class="truncate">
                {{ properties.title }}
            </div>
        </div>
    </div>
</template>
