<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';
import { inject, ref } from 'vue';

// ── Local Framework
import { gridDetailIsSplitKey } from '@/components/ui/grid/gridDetail';

// ── Static Components
import BaseButton from '@/components/ui/button/BaseButton.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { icon, iconDark, overline, title } = defineProps<{ icon?: string | null; iconDark?: string | null; overline?: string; title: string }>();

defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const panesAreSplit = inject(gridDetailIsSplitKey, ref(false));
</script>

<template>
    <div class="dpuse-prose relative pt-4" data-region="StudioDocumentPanel">
        <!-- Header -->
        <BaseButton class="group block w-full min-w-0 cursor-pointer text-left" :class="{ 'pointer-events-none': panesAreSplit }" @click="$emit('close')">
            <!-- Overline with optional back icon. -->
            <div class="mr-9 flex min-w-0 items-center gap-x-0.5 text-sm leading-tight text-muted group-hover:text-blue-500">
                <ArrowLeftIcon v-if="!panesAreSplit" class="size-4 flex-none" />
                <span class="min-w-0 truncate">{{ overline }} </span>
            </div>

            <!-- Icon/Title -->
            <div class="mr-9! flex min-w-0 items-start gap-x-2">
                <ConfigIcon class="mt-1 h-8 w-7" :icon="icon" :icon-dark="iconDark" />
                <h1 class="min-w-0 py-1 text-left leading-8! wrap-break-word whitespace-normal">
                    {{ title }}
                </h1>
            </div>
        </BaseButton>

        <!-- Content -->
        <slot />
    </div>
</template>

<style scoped>
:deep(ul) {
    list-style: none;
    padding-left: 0;
}
</style>
