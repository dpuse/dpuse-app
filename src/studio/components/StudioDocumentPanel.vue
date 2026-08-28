<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
import ClearSelectionButton from '@/components/ui/button/ClearSelectionButton.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

interface Properties {
    icon?: string | null;
    iconDark?: string | null;
    overline?: string;
    title: string;
}
const { icon, iconDark, overline, title } = defineProps<Properties>();

defineEmits<{ clear: []; close: [] }>();
</script>

<template>
    <div class="dpuse-prose relative pt-4" data-region="StudentDocumentPanel">
        <!-- Header -->
        <Button class="group block w-full min-w-0 cursor-pointer text-left md:pointer-events-none" shape="minimal" @click="$emit('close')">
            <div class="mr-9 flex min-w-0 items-center gap-x-0.5 text-sm leading-tight text-muted group-hover:text-blue-500">
                <!-- Back Arrow -->
                <ArrowLeftIcon class="size-4 flex-none md:hidden" />

                <!-- Overline -->
                <span class="min-w-0 truncate">{{ overline }} </span>
            </div>

            <!-- Title - the gutter for the clear button sits on the row rather than the heading, so the icon is inside
                 it too. Aligned to the top rather than centred: the title wraps, and centring would drift the icon down
                 the block as lines are added. -->
            <div class="mr-9! flex min-w-0 items-center gap-x-2">
                <!-- Icon -->
                <ConfigIcon class="size-7" :icon="icon" :icon-dark="iconDark" />

                <!-- Title -->
                <h1 class="min-w-0 py-1 text-left leading-8! wrap-break-word whitespace-normal">
                    {{ title }}
                </h1>
            </div>
        </Button>

        <!-- Clear Selection Action -->
        <ClearSelectionButton class="absolute top-2 right-0" @click="$emit('clear')" />

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
