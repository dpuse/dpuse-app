<script setup lang="ts">
// External dependencies
import type { HTMLAttributes } from 'vue';
import { reactiveOmit } from '@vueuse/core';
import { Separator, type SeparatorProps } from 'reka-ui';

// Application modules
import { cn } from '@/lib/utils';

// Properties
type Properties = SeparatorProps & { class?: HTMLAttributes['class'] };
const properties = withDefaults(defineProps<Properties>(), { orientation: 'horizontal', decorative: true });
const delegatedProperties = reactiveOmit(properties, 'class');
</script>

<template>
    <Separator
        data-slot="separator"
        v-bind="delegatedProperties"
        :class="
            cn(
                'bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
                properties.class
            )
        "
    />
</template>
