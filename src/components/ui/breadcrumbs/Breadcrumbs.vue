<script setup lang="ts" generic="T extends BreadcrumbConfig">
// Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';

// Properties, Slots & Emits
const { items = [] } = defineProps<{ items?: T[] }>();
defineEmits<{ select: [index: number, item: T] }>();
</script>

<template>
    <div class="flex h-9.25 min-w-0 items-center overflow-hidden">
        <!-- TODO: Is there enough room around breadcrumbs to effectively tap on touch devices? -->
        <template v-for="(item, index) in items" :key="item.id">
            <span v-if="index > 0" class="flex-none text-zinc-400">/</span>
            <component
                :is="index < items.length - 1 && item.to != null ? 'RouterLink' : index < items.length - 1 ? Button : 'div'"
                v-bind="index < items.length - 1 && item.to == null ? { variant: 'minimal' } : {}"
                :aria-disabled="index === items.length - 1 || undefined"
                :aria-label="item.label"
                class="flex h-full items-center px-1.5"
                :class="[item.icon ? 'flex-none' : 'max-w-full min-w-0 overflow-hidden', index === items.length - 1 ? 'text-zinc-400' : 'text-zinc-700 hover:text-zinc-950']"
                :to="index === items.length - 1 || item.to == null ? undefined : { name: item.to, query: { ...$route.query, wbView: item.to } }"
                @click="index < items.length - 1 ? $emit('select', index, item) : undefined"
            >
                <span v-if="item.icon" class="flex-none">
                    <component :is="item.icon" aria-hidden="true" class="size-4.75!" />
                </span>
                <span v-else class="min-w-0 truncate">{{ item.label }}</span>
            </component>
        </template>
    </div>
</template>

<!--
<component
    :is="index < items.length - 1 && item.to != null ? 'RouterLink' : index < items.length - 1 ? 'button' : 'div'"
    v-for="(item, index) in items"
    :key="item.id"
    :aria-disabled="index === items.length - 1 || undefined"
    class="min-w-0"
    :class="index === items.length - 1 ? 'text-zinc-400' : 'text-zinc-700 hover:text-zinc-950'"
    :aria-label="item.label"
    :title="item.label"
    :to="index === items.length - 1 || item.to == null ? undefined : { name: item.to, query: { ...$route.query, wbView: item.to } }"
    :type="index < items.length - 1 && item.to == null ? 'button' : undefined"
    @click="index < items.length - 1 ? $emit('select', index, item) : undefined"
>
    <span class="flex min-w-0 items-center">
        <span v-if="index > 0" class="mr-1 shrink-0">&gt;</span>

        <component :is="item.icon" v-if="item.icon" aria-hidden="true" class="inline size-5! shrink-0 align-text-bottom" />
        <span v-else :class="index > 0 ? 'truncate' : undefined">{{ item.label }}</span>
    </span>
</component>
-->
