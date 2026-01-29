<script setup lang="ts">
// Vendor dependencies
import type { HTMLAttributes } from 'vue';
import { Primitive, type PrimitiveProps } from 'reka-ui';

// Application core
import { buttonVariants } from '.';
import type { ButtonVariants } from '.';
import { cn } from '@/lib/utils';

// Properties
interface Properties extends PrimitiveProps {
    variant?: ButtonVariants['variant'];
    size?: ButtonVariants['size'];
    class?: HTMLAttributes['class'];
}
const properties = withDefaults(defineProps<Properties>(), { as: 'button' });
</script>

<template>
    <Primitive data-slot="button" :as="as" :as-child="asChild" :class="cn(buttonVariants({ variant, size }), properties.class)">
        <slot />
    </Primitive>
</template>
