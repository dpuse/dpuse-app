<script setup lang="ts">
type Properties = { hasChildren?: boolean; isActive?: boolean; label: string };
const { hasChildren = false, isActive = false, label } = defineProps<Properties>();

defineEmits<{ remove: []; select: [] }>();
</script>

<template>
    <div class="group flex w-full items-center border-b border-separator text-sm transition-colors" :class="isActive ? 'bg-surface' : 'hover:bg-surface'">
        <button
            class="flex min-w-0 flex-1 items-center gap-1.5 px-3 py-2 text-left"
            :class="isActive ? 'font-medium text-accent' : 'text-content'"
            type="button"
            @click="$emit('select')"
        >
            <span class="flex-1 truncate">{{ label || 'Untitled' }}</span>
            <span v-if="hasChildren" aria-hidden="true" class="shrink-0 text-subtle">›</span>
        </button>
        <button
            class="invisible mr-2 shrink-0 px-0.5 py-0 text-base leading-none text-muted transition-colors group-hover:visible hover:text-red-500"
            type="button"
            aria-label="Remove"
            @click.stop="$emit('remove')"
        >
            ×
        </button>
    </div>
</template>
