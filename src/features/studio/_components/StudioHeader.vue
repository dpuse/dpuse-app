<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowLeftIcon } from '@lucide/vue';
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import { assistantPaneIsVisible, viewportIsWide } from '@/state/appLayout';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { overline, title, to } = defineProps<{ overline?: string; title: string; to?: RouteLocationRaw }>();
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] flex h-13.75 flex-none flex-col justify-center"
        :class="viewportIsWide ? (assistantPaneIsVisible ? 'pr-0 pl-4' : 'pr-16 pl-4') : 'px-16'"
        data-region="StudioHeader"
    >
        <!-- Content indented from left and right to allow for logos when display is narrow.
             NOTE: If width of logos changes, the above settings need to be adjusted accordingly. -->

        <component :is="to ? 'RouterLink' : 'div'" class="min-w-0 text-content" :class="{ 'text-center': !viewportIsWide, 'group cursor-pointer': to }" :to="to">
            <!-- Overline -->
            <div
                v-if="overline"
                class="flex min-w-0 items-center gap-x-0.5 text-sm leading-tight text-muted group-hover:text-blue-500"
                :class="{ 'justify-center': !viewportIsWide }"
            >
                <ArrowLeftIcon class="size-4 flex-none" :stroke-width="2" />
                <span class="min-w-0 truncate">{{ overline }}</span>
                <span class="size-4 flex-none" />
            </div>

            <!-- Title -->
            <div class="ml-0.5 truncate leading-snug">{{ title }}</div>
        </component>
    </header>
</template>
