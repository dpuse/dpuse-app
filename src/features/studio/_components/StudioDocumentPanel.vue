<script setup lang="ts">
// ── External Dependencies & Registrations
import { ListXIcon } from '@lucide/vue';
import { ArrowLeftIcon } from '@lucide/vue';

// ── Static Components
import BaseButton from '@/components/ui/button/BaseButton.vue';
import IconButton from '@/components/ui/button/IconButton.vue';
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
    <div class="dpuse-prose relative pt-4" data-region="StudioDocumentPanel">
        <!-- Header -->
        <BaseButton class="group block w-full min-w-0 cursor-pointer text-left md:pointer-events-none" @click="$emit('close')">
            <div class="mr-9 flex min-w-0 items-center gap-x-0.5 text-sm leading-tight text-muted group-hover:text-blue-500">
                <!-- Back Arrow -->
                <ArrowLeftIcon class="size-4 flex-none md:hidden" />

                <!-- Overline -->
                <span class="min-w-0 truncate">{{ overline }} </span>
            </div>

            <!-- Title - the gutter for the clear button sits on the row rather than the heading, so the icon is inside
                 it too. The icon is boxed to the height of the heading's first line (py-1 + leading-8) rather than to
                 its own size, so it stays centred on that line instead of drifting down the block as the title wraps. -->
            <div class="mr-9! flex min-w-0 items-start gap-x-2">
                <!-- Icon -->
                <ConfigIcon class="mt-1 h-8 w-7" :icon="icon" :icon-dark="iconDark" />

                <!-- Title -->
                <h1 class="min-w-0 py-1 text-left leading-8! wrap-break-word whitespace-normal">
                    {{ title }}
                </h1>
            </div>
        </BaseButton>

        <!-- Clear Selection Action -->
        <IconButton accessible-label="Clear the selection" class="absolute top-2 right-0" rounded size="sm" variant="ghost" @click="$emit('clear')">
            <ListXIcon class="size-5.5!" stroke-width="1.25" />
        </IconButton>

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
