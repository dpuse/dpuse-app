<script setup lang="ts">
// External Dependencies & Registrations
import { PlusIcon } from '@lucide/vue';

// Options, Properties, Slots & Emits
defineProps<{ messageItemLabel: string; descriptionItemLabel: string; actionItemLabel: string }>();
</script>

<template>
    <div class="mt-[7.5vh] text-center" data-region="EmptyPlaceholder">
        <svg class="mx-auto size-12 text-subtle" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path
                vector-effect="non-scaling-stroke"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
        </svg>
        <h3 class="mt-2 text-sm font-semibold text-emphasis">No {{ messageItemLabel }}</h3>
        <p class="mt-1 text-sm text-muted">Get started by creating a new {{ descriptionItemLabel }}.</p>
        <div class="mt-6">
            <button
                type="button"
                class="inline-flex items-center rounded-md bg-success px-3 py-2 text-sm font-semibold text-success-text shadow-xs hover:bg-success-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success-ring"
            >
                <PlusIcon class="mr-1.5 -ml-0.5 size-5" aria-hidden="true" />
                New {{ actionItemLabel }}
            </button>
        </div>
    </div>
</template>
