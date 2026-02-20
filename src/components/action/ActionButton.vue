<script setup lang="ts">
// Properties
type Properties = { padding?: 'default' | 'iconSmall' | 'iconLarge'; variant?: 'ghost' | 'outline' };
const { padding = 'default', variant = 'ghost' } = defineProps<Properties>();

// Classes
const focusVisibleClasses = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 dark:focus-visible:outline-zinc-400';
const hoverClasses = 'hover:bg-gray-50';
const paddingClasses = padding === 'iconSmall' ? 'p-1.25' : padding === 'iconLarge' ? 'p-2' : 'px-3.5 py-2';
const variantClasses = variant === 'outline' ? 'inset-ring inset-ring-gray-300' : '';
</script>

<template>
    <button
        class="bg-background-primary inline-flex items-center justify-center gap-x-2 rounded-md font-light transition-[background-color] duration-150"
        :class="[focusVisibleClasses, hoverClasses, paddingClasses, variantClasses]"
        type="button"
    >
        <slot />
    </button>
</template>
