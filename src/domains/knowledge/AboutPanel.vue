<script setup lang="ts">
// Local (App) Framework
import { useWorkflowOptionConfigs } from '@/domains/workbench/workflow/useWorkflowOptionConfigs';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/ScrollArea.vue';

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const workflowOptionConfigs = useWorkflowOptionConfigs();
</script>

<template>
    <ScrollArea>
        <article class="bg-white py-24 sm:py-32">
            <div class="mx-auto max-w-7xl px-6 lg:px-8">
                <!-- Hero Section -->
                <div class="mx-auto max-w-2xl lg:text-center">
                    <h2 class="text-base/7 font-semibold text-indigo-600">From data to understanding - The workflow</h2>
                    <p class="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">Everything you need to deploy your app</p>
                    <p class="mt-6 text-lg/8 text-gray-600">
                        Quis tellus eget adipiscing convallis sit sit eget aliquet quis. Suspendisse eget egestas a elementum pulvinar et feugiat blandit at. In mi viverra elit
                        nunc.
                    </p>
                </div>

                <!-- ??? Section -->
                <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        <Button v-for="config in workflowOptionConfigs" :key="config.id" shape="minimal" class="flex flex-col" :to="{ name: config.id, query: $route.query }">
                            <dt class="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900">
                                <!-- <component :is="feature.icon" class="size-5 flex-none text-indigo-600" aria-hidden="true" /> -->
                                <div aria-hidden="true" style="height: 32px; width: 32px" v-html="config.icon" />
                                {{ config.label }}
                            </dt>
                            <dd class="mt-4 flex flex-auto flex-col text-base/7 text-gray-600">
                                <p class="flex-auto">{{ config.description }}</p>
                                <p class="mt-6">
                                    <!-- <a :href="config.href" class="text-sm/6 font-semibold text-indigo-600 hover:text-indigo-500"
                                            >Learn more <span aria-hidden="true">→</span></a
                                        > -->
                                </p>
                            </dd>
                        </Button>
                    </dl>
                </div>
            </div>
        </article>
    </ScrollArea>
</template>
