<script setup lang="ts">
// ── Local (App) Framework
import { t } from '@/state/locale';
import T from './ManageConfigsLayout.json';

// ── Local Components - Static
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONFIG_TYPES = ['Connectors', 'Connections', 'Contexts', 'Presenters', 'Tutorials'];
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Manage_Configs')" to="workbench" />

        <div class="relative mx-4 flex min-h-0 flex-1 flex-col">
            <div class="flex gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                <div v-for="label in CONFIG_TYPES" :key="label" class="mt-0.5 mb-0 border-y-2 border-t-transparent pt-1 pb-2 text-sm leading-tight">
                    {{ label }}
                </div>
            </div>

            <RouterView />
        </div>
    </WorkbenchLayout>
</template>
