<script setup lang="ts">
// External Dependencies
import { useRoute } from 'vue-router';
import { XIcon } from 'lucide-vue-next';
import { shallowRef, watch } from 'vue';

// App Core
import T from '@/locales/views/workflow/Workflow.json';
import workflowStepData from '~/knowledge/workbench/benchtops/workflow/workflowSteps.json';
import { localeId, localiseConfigs, t } from '@/locales';

// App Components - Statically imported so always available, even after app goes offline.
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Card from '@/components/card/Card.vue';
import Header from '@/components/header/Header.vue';

// States ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const route = useRoute();

const workflowStepConfigs = shallowRef();
watch(localeId, (newLocaleId) => (workflowStepConfigs.value = localiseConfigs(workflowStepData, newLocaleId)), { immediate: true });

const features = [
    {
        name: 'Push to deploy',
        description: 'Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.',
        href: '#',
        icon: XIcon
    },
    {
        name: 'SSL certificates',
        description: 'Pellentesque enim a commodo malesuada turpis eleifend risus. Facilisis donec placerat sapien consequat tempor fermentum nibh.',
        href: '#',
        icon: XIcon
    },
    {
        name: 'Simple queues',
        description: 'Pellentesque sit elit congue ante nec amet. Dolor aenean curabitur viverra suspendisse iaculis eget. Nec mollis placerat ultricies euismod.',
        href: '#',
        icon: XIcon
    }
];
</script>

<template>
    <BenchtopShell>
        <!-- <Header
            :breadcrumbs="[{ id: 'workbench', label: t(T, 'wb.label') }]"
            class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] w-full max-w-4xl"
            data-testid="header"
            :title="t(T, 'wb.wf.label')"
            :workbench-pane-is-hidden="false"
        /> -->
        <div class="bg-white py-24 sm:py-32">
            <div class="mx-auto max-w-7xl px-6 lg:px-8">
                <div class="mx-auto max-w-2xl lg:text-center">
                    <h2 class="text-base/7 font-semibold text-indigo-600">Deploy faster</h2>
                    <p class="mt-2 text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl lg:text-balance">Everything you need to deploy your app</p>
                    <p class="mt-6 text-lg/8 text-gray-600">
                        Quis tellus eget adipiscing convallis sit sit eget aliquet quis. Suspendisse eget egestas a elementum pulvinar et feugiat blandit at. In mi viverra elit
                        nunc.
                    </p>
                </div>
                <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                    <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                        <div v-for="feature in features" :key="feature.name" class="flex flex-col">
                            <dt class="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900">
                                <component :is="feature.icon" class="size-5 flex-none text-indigo-600" aria-hidden="true" />
                                {{ feature.name }}
                            </dt>
                            <dd class="mt-4 flex flex-auto flex-col text-base/7 text-gray-600">
                                <p class="flex-auto">{{ feature.description }}</p>
                                <p class="mt-6">
                                    <a :href="feature.href" class="text-sm/6 font-semibold text-indigo-600 hover:text-indigo-500">Learn more <span aria-hidden="true">→</span></a>
                                </p>
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>

        <BenchtopScroller>
            <div class="mr-auto ml-[clamp(0px,calc((100%-56rem)/2),5rem)] max-w-4xl">
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4 p-4">
                    <RouterLink
                        v-for="config of workflowStepConfigs"
                        :key="config.id"
                        class="bg-card outline-boundary overflow-hidden rounded-lg font-light outline -outline-offset-1"
                        :to="{ name: config.id, query: route.query }"
                    >
                        <Card :icon="config.icon" :icon-color="config.color" :label="config.label" :overline="t(T, 'wb.wf.step', { number: config.step })" />
                    </RouterLink>
                </div>
            </div>
        </BenchtopScroller>
    </BenchtopShell>
</template>
