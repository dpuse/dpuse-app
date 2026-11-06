<script setup lang="ts">
// ── External Dependencies & Registrations
import { CableIcon } from '@lucide/vue';
import { computed } from 'vue';

// ── DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructItemPath, type DataViewConnection } from './dataViewSummary';

// ── Static Components
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { connectionNodeConfig, dataViewConnection } = defineProps<{
    connectionNodeConfig: ConnectionNodeConfig | undefined; // Undefined until an item is chosen.
    dataViewConnection: Pick<DataViewConnection, 'icon' | 'iconDark' | 'label'> | undefined; // Undefined until a connection is chosen, or once it has gone.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const folderLabels = computed(() => connectionNodeConfig?.folderPath.split('/').filter((folderLabel) => folderLabel !== '') ?? []);
const itemPath = computed(() => (connectionNodeConfig ? constructItemPath(connectionNodeConfig) : undefined)); // The tooltip gives the path the engine uses.
</script>

<template>
    <!-- Laid out as the item step's trail, so the data view's source sits in the same place on every step. Only text,
         because there is nothing here to go back to. Screen readers skip it, because they hear each choice with its
         task in the task bar. -->
    <div aria-hidden="true" class="flex min-w-0 items-center overflow-hidden" data-region="ItemTrail" :title="itemPath">
        <!-- Connection ─ Named by its tooltip, as the item step's trail names it. -->
        <ConfigIcon v-if="dataViewConnection" class="size-5" :icon="dataViewConnection.icon" :icon-dark="dataViewConnection.iconDark" :title="dataViewConnection.label" />
        <CableIcon v-else class="size-5 flex-none" :stroke-width="1.5" />

        <!-- Folders -->
        <template v-for="(folderLabel, index) in folderLabels" :key="index">
            <span class="mx-1.5 flex-none text-subtle">/</span>
            <span class="min-w-0 truncate text-muted">{{ folderLabel }}</span>
        </template>

        <!-- Item ─ Cut last, so its name stays in view after the folders shrink. -->
        <template v-if="connectionNodeConfig">
            <span class="mx-1.5 flex-none text-subtle">/</span>
            <span class="max-w-full min-w-0 shrink-0 truncate">{{ connectionNodeConfig.label }}</span>
        </template>
    </div>
</template>
