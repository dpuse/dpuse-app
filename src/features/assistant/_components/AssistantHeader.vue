<script setup lang="ts">
// ── External Dependencies & Registrations
import type { RouteLocationRaw } from 'vue-router';

// ── Local Framework
import { studioPaneIsVisible, viewportIsWide } from '@/state/appLayout';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { overline, title, to } = defineProps<{ overline?: string; title: string; to?: RouteLocationRaw }>();
</script>

<template>
    <header
        class="mt-[env(safe-area-inset-top)] flex h-13.75 flex-none flex-col justify-center border-t border-t-boundary"
        :class="viewportIsWide ? (studioPaneIsVisible ? 'pr-11 pl-0' : 'pr-12 pl-11') : 'px-14'"
        data-region="AssistantHeader"
    >
        <!-- Content indented from left and right to allow for logos when display is narrow.
             NOTE: If width of logos changes, the following settings need to be adjusted accordingly. -->

        <component
            :is="to ? 'RouterLink' : 'div'"
            class="min-w-0"
            :class="{
                'text-center': !viewportIsWide,
                'cursor-pointer text-accent hover:text-accent-hover hover:underline hover:decoration-accent-hover/40 hover:underline-offset-2': to
            }"
            :to="to"
        >
            <!-- Overline -->
            <div v-if="overline" class="truncate text-sm leading-tight">
                {{ overline }}
            </div>

            <!-- Title -->
            <div class="truncate leading-snug">
                {{ title }}
            </div>
        </component>
    </header>
</template>
