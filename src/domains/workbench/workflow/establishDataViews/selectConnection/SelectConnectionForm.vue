<script setup lang="ts">
// External Dependencies
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionLocalisedConfig } from '@dpuse/dpuse-shared/component/connector';

// App Framework
import T from '@/translations/domains/workbench/workflow/establishDataViews/selectConnection/SelectConnectionForm.json';
import { t } from '@/translations';

// App Static Components
import Button from '@/components/ui/button/Button.vue';

// Properties, Emits & Slots ───────────────────────────────────────────────────────────────────────────────────────────

const properties = defineProps<{ connectionLocalisedConfig?: ConnectionLocalisedConfig }>();

const emit = defineEmits<{ submit: [] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// Derived State ───────────────────────────────────────────────────────────────────────────────────────────────────────

const selectedConnectionDescription = computed(() => {
    const description = properties.connectionLocalisedConfig?.description;
    return typeof description === 'string' && description.trim().length > 0 ? description : undefined;
});

const selectedConnectionType = computed(() => properties.connectionLocalisedConfig?.connectorConfig.label ?? undefined);

const implementationSummary = computed(() => {
    const implementations = properties.connectionLocalisedConfig?.connectorConfig.implementations;
    if (Array.isArray(implementations)) return implementations.join(', ');
    if (implementations != null) return String(implementations);
    return t(T, 'Implementation_not_available');
});

// UI Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    if (properties.connectionLocalisedConfig == null) return;
    emit('submit');
    await router.push({ name: 'selectNode', query: { ...route.query, wbView: 'selectNode' } });
}

// async function testAuth(): Promise<void> {
//     if (connectionLocalisedConfig == null || connectionLocalisedConfig == null) return;
//     const { processRequest } = await useEngine();
//     (await processRequest('authenticateConnection', connectionLocalisedConfig, {
//         accountId: "JMT's Account",
//         windowCenterX: screen.width / 2,
//         windowCenterY: screen.height / 2
//     })) as EngineAuthActionOptions;
// }
</script>

<template>
    <div class="flex h-full flex-col gap-y-3">
        <div class="flex flex-col gap-y-2">
            <h2 class="text-2xl font-normal">{{ t(T, 'Select_Connection') }}</h2>
            <p class="text-muted">{{ t(T, 'Select_a_connection_to_configure_the_data_view_before_continuing') }}</p>
        </div>

        <form class="mt-3 flex flex-1 flex-col gap-y-6" @submit.prevent="handleSubmit">
            <div v-if="properties.connectionLocalisedConfig" class="bg-card outline-boundary flex flex-col gap-y-6 rounded-lg p-4 outline -outline-offset-1">
                <section class="flex flex-col gap-y-2">
                    <h3 class="text-sm font-medium">{{ t(T, 'Selected_Connection') }}</h3>
                    <div class="text-lg font-normal">{{ properties.connectionLocalisedConfig.label }}</div>
                    <p v-if="selectedConnectionDescription" class="text-muted text-sm">{{ selectedConnectionDescription }}</p>
                </section>

                <section class="grid gap-4 sm:grid-cols-2">
                    <div class="flex flex-col gap-y-1 rounded-md bg-zinc-50 px-3 py-3 dark:bg-zinc-300/10">
                        <span class="text-muted text-xs font-medium tracking-wide uppercase">{{ t(T, 'Connection_Type') }}</span>
                        <span>{{ selectedConnectionType }}</span>
                    </div>

                    <div class="flex flex-col gap-y-1 rounded-md bg-zinc-50 px-3 py-3 dark:bg-zinc-300/10">
                        <span class="text-muted text-xs font-medium tracking-wide uppercase">{{ t(T, 'Capabilities') }}</span>
                        <span>{{ implementationSummary }}</span>
                    </div>
                </section>

                <section class="flex flex-col gap-y-3">
                    <h3 class="text-sm font-medium">{{ t(T, 'Configuration') }}</h3>
                    <div class="border-separator text-muted rounded-md border border-dashed px-4 py-6 text-sm">
                        {{ t(T, 'Add_connection_specific_fields_here_as_this_workflow_evolves') }}
                    </div>

                    <!-- <Input id="label" v-model="connectionLabel" :label="t(T, 'Label')" :placeholder="t(T, 'Label')" :required="true" type="text" /> -->

                    <!-- <Button @click="testAuth">Auth...</Button> -->
                </section>
            </div>

            <div v-else class="bg-card outline-boundary flex flex-col gap-y-2 rounded-lg p-4 outline -outline-offset-1">
                <h3 class="text-sm font-medium">{{ t(T, 'No_connection_selected') }}</h3>
                <p class="text-muted text-sm">{{ t(T, 'Choose_a_connection_from_the_list_to_continue') }}</p>
            </div>

            <div class="mt-auto flex justify-end border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <Button
                    :class="properties.connectionLocalisedConfig == null ? 'cursor-not-allowed opacity-50' : undefined"
                    :disabled="properties.connectionLocalisedConfig == null"
                    type="submit"
                    variant="primary"
                >
                    {{ t(T, 'Continue') }}
                </Button>
            </div>
        </form>
    </div>
</template>
