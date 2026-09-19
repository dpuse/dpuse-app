<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';
import { inject, ref } from 'vue';

// ── Local Framework
import { gridDetailIsSplitKey } from '@/components/ui/grid/gridDetail';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { icon, iconDark, overline, title } = defineProps<{ icon?: string | null; iconDark?: string | null; overline?: string; title: string }>();

defineSlots<{
    actions?(): unknown; // Rendered at the right of the title row.
    default?(): unknown; // Rendered below the header and tags.
    tags?(): unknown; // Rendered as a wrapping row below the header.
}>();

defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const panesAreSplit = inject(gridDetailIsSplitKey, ref(false));
</script>

<template>
    <div class="dpuse-prose relative pt-4" data-region="StudioDocumentPanel">
        <!-- Header -->
        <div class="relative">
            <ActionWrapper class="group block w-full min-w-0 cursor-pointer text-left" :class="{ 'pointer-events-none': panesAreSplit }" @click="$emit('close')">
                <!-- Overline with optional back icon. -->
                <div class="mr-9 flex min-w-0 items-center gap-x-0.5 text-sm leading-tight text-muted group-hover:text-blue-500">
                    <ArrowLeftIcon v-if="!panesAreSplit" class="size-4 flex-none" />
                    <span class="min-w-0 truncate">{{ overline }} </span>
                </div>

                <!-- Icon/Title -->
                <div class="mr-9! flex min-w-0 items-start gap-x-2">
                    <!-- One title line tall, so the icon centres on the first line however the title wraps. -->
                    <div class="flex h-10 flex-none items-center">
                        <ConfigIcon class="h-7":icon="icon" :icon-dark="iconDark" />
                    </div>
                    <h1 class="min-w-0 py-1 text-left leading-8! wrap-break-word whitespace-normal">
                        {{ title }}
                    </h1>
                </div>
            </ActionWrapper>

            <!-- Actions — beside the header button rather than inside it, because a button may not contain buttons. They sit in
                 the right margin the header keeps clear, and are centred on the title row whatever the overline's height. -->
            <div v-if="$slots.actions" class="absolute right-0 bottom-0 flex h-10 items-center">
                <slot name="actions" />
            </div>
        </div>

        <!-- Tags -->
        <div v-if="$slots.tags" class="mt-3 mb-6 flex flex-wrap gap-1.5">
            <slot name="tags" />
        </div>

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
