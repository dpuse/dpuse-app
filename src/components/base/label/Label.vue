<script setup lang="ts">
// External dependencies
import type { HTMLAttributes } from 'vue';
import { Label } from 'reka-ui';
import type { LabelProps } from 'reka-ui';
import { reactiveOmit } from '@vueuse/core';

// Application modules
import { cn } from '@/lib/utils';

// Properties
type Properties = LabelProps & { class?: HTMLAttributes['class'] };
const properties = defineProps<Properties>();
const delegatedProperties = reactiveOmit(properties, 'class');
</script>

<template>
    <Label
        data-slot="label"
        v-bind="delegatedProperties"
        :class="
            cn(
                'flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
                properties.class
            )
        "
    >
        <slot />
    </Label>
</template>
