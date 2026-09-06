<script setup lang="ts">
// What the chat pane shows before its first message. This is where the assistant's former 'about' view ended up: the
// workflow it described is most useful at the point the user has not yet asked anything, and it was a whole view of its
// own for content the studio's home screen already presents at full size.
//
// Sized for a pane rather than a page. The original was laid out for the width of a browser window — 'py-24', a
// 7xl measure, a 5xl heading — and this pane can be a fifth of one.

// ── Local Framework
import { useOptions } from '@/features/studio/options/useOptions';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = useOptions();
</script>

<template>
    <div class="mx-auto flex max-w-prose flex-col justify-center pt-4 pb-8" data-region="ChatEmptyState">
        <h2 class="text-sm font-semibold text-accent">From data to understanding</h2>
        <p class="mt-1 text-lg font-semibold tracking-tight text-pretty text-emphasis @md:text-xl">Ask about your data, or start with the workflow</p>

        <!-- One column until the pane is genuinely wide enough for two. A container query, not a viewport one: this sits
             inside a pane nested in another pane, so neither splitter's position is visible to a media query. -->
        <dl class="mt-6 grid grid-cols-1 gap-3 @md:grid-cols-2">
            <Button
                v-for="config in workflowOptionConfigs"
                :key="config.id"
                class="flex flex-col items-start rounded-md border border-separator p-3 text-left"
                shape="minimal"
                :to="{ name: config.id, query: $route.query }"
            >
                <dt class="flex items-center gap-x-2 text-sm font-semibold text-emphasis">
                    <div aria-hidden="true" class="size-6 flex-none" v-html="config.icon" />
                    {{ config.label }}
                </dt>
                <dd class="mt-1 text-sm text-muted">{{ config.description }}</dd>
            </Button>
        </dl>
    </div>
</template>
