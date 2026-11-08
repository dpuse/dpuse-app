<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { ArrowLeftIcon, CableIcon } from '@lucide/vue';

// ── DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { itemStepTrail } from './_itemStepTrail';
import { t } from '@/state/locale';
import { TEXT } from './ItemTrail_.json';
import { constructItemPath, type DataViewConnection } from './dataViewSummary';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { connectionNodeConfig, dataViewConnection } = defineProps<{
    connectionNodeConfig: ConnectionNodeConfig | undefined; // The saved item. Undefined until an item is chosen, and on the connection step.
    dataViewConnection: Pick<DataViewConnection, 'icon' | 'iconDark' | 'label'> | undefined; // Undefined until a connection is chosen, or once it has gone.
}>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The item step fills in its open folder and chosen item, and its folders can be opened. Every other step shows the
// saved item as text.
const crumbsAreLinks = computed(() => itemStepTrail.value != null);
const folderLabels = computed(() =>
    itemStepTrail.value
        ? itemStepTrail.value.folderNodeConfigs.map((folderNodeConfig) => folderNodeConfig.label)
        : (connectionNodeConfig?.folderPath.split('/').filter((folderLabel) => folderLabel !== '') ?? [])
);
const itemConfig = computed(() => (itemStepTrail.value ? itemStepTrail.value.itemConfig : connectionNodeConfig));
const itemPath = computed(() => (itemConfig.value ? constructItemPath(itemConfig.value) : undefined)); // The tooltip gives the path the engine uses.
const connectionLabel = computed(() => dataViewConnection?.label ?? t(TEXT, 'home.label'));
const connectionNameIsShown = computed(() => !crumbsAreLinks.value && itemConfig.value == null && dataViewConnection != null); // With nothing after it, the icon alone would not say which connection is chosen.

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Index 0 is the connection and each folder follows it. The open folder is the last one and is plain text, because
// opening it again would do nothing.
function isCrumbLink(index: number): boolean {
    return crumbsAreLinks.value && index < folderLabels.value.length;
}
</script>

<template>
    <!-- One row the header keeps on every step, so it does not change between them. Screen readers skip it on the steps
         where it is only text, because they hear each choice with its task in the task bar. -->
    <div class="flex h-full min-w-0 items-center overflow-hidden" :aria-hidden="crumbsAreLinks ? undefined : 'true'" data-region="ItemTrail" :title="itemPath">
        <!-- Back Button ─ Narrow screens show the item's preview in place of the list, so the trail gives way to one
             button back to it, followed by the chosen item's name. -->
        <template v-if="itemStepTrail?.backLabel != null && itemConfig">
            <ActionWrapper
                :aria-label="t(TEXT, 'back.aria', { label: itemStepTrail.backLabel })"
                class="flex h-10 min-w-0 shrink cursor-pointer items-center gap-x-2 text-accent transition-colors hover:text-accent-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                @click="itemStepTrail.returnToList()"
            >
                <ArrowLeftIcon aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                <span class="min-w-0 truncate">{{ itemStepTrail.backLabel }}</span>
            </ActionWrapper>
            <span aria-hidden="true" class="mx-1.5 flex-none text-subtle">/</span>
            <span class="min-w-0 flex-1 truncate text-muted">{{ itemConfig.label }}</span>
        </template>

        <template v-else>
            <!-- Connection ─ Named by its tooltip, because the icon alone may not say what it is. -->
            <component
                :is="isCrumbLink(0) ? ActionWrapper : 'span'"
                :aria-label="connectionLabel"
                class="flex flex-none items-center"
                :class="{ 'cursor-pointer focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring': isCrumbLink(0) }"
                :title="connectionLabel"
                @click="isCrumbLink(0) ? itemStepTrail?.selectFolder(0) : undefined"
            >
                <ConfigIcon v-if="dataViewConnection" class="size-5" :icon="dataViewConnection.icon" :icon-dark="dataViewConnection.iconDark" />
                <CableIcon v-else aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
            </component>
            <span v-if="connectionNameIsShown" class="ml-2 min-w-0 truncate">{{ connectionLabel }}</span>

            <!-- Folders -->
            <template v-for="(folderLabel, index) in folderLabels" :key="index">
                <span aria-hidden="true" class="mx-1.5 flex-none text-subtle">/</span>
                <ActionWrapper
                    v-if="isCrumbLink(index + 1)"
                    class="max-w-full min-w-0 cursor-pointer overflow-hidden text-accent transition-colors hover:text-accent-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    @click="itemStepTrail?.selectFolder(index + 1)"
                >
                    <span class="block truncate">{{ folderLabel }}</span>
                </ActionWrapper>
                <span v-else class="min-w-0 truncate text-muted">{{ folderLabel }}</span>
            </template>

            <!-- Item ─ Cut last, so its name stays in view after the folders shrink. On the item step it scrolls the list
                 back to the item. -->
            <template v-if="itemConfig">
                <span aria-hidden="true" class="mx-1.5 flex-none text-subtle">/</span>
                <ActionWrapper
                    v-if="crumbsAreLinks"
                    class="max-w-full min-w-0 shrink-0 cursor-pointer overflow-hidden text-content transition-colors hover:text-accent focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    @click="itemStepTrail?.revealItem()"
                >
                    <span class="block truncate">{{ itemConfig.label }}</span>
                </ActionWrapper>
                <span v-else class="max-w-full min-w-0 shrink-0 truncate">{{ itemConfig.label }}</span>
            </template>
        </template>
    </div>
</template>
