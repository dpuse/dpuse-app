<script setup lang="ts">
// ── External Dependencies
import { defineAsyncComponent, ref } from 'vue';

// ── Local (App) Framework
import { load } from '@/state/component.ts';
import { t } from '@/state/locale';
import T from './ManageConfigsLayout.json';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import HomeIcon from '@/components/icons/HomeIcon.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

// ── Local Components - Dynamic
const ManageContextsPanel = defineAsyncComponent(load('ManageContextsPanel', () => import('./ManageContextsPanel.vue')));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONFIG_TYPE_NAMES = ['Home', 'Connectors', 'Connections', 'Contexts', 'Presenters', 'Tutorials'];

// ── States ───────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConfigTypeName = ref('Home');
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Manage_Configs')" to="workbench" />

        <div class="mx-4 flex min-h-0 flex-1 flex-col">
            <!-- Task Bar -->
            <div class="flex items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator">
                <template v-for="name in CONFIG_TYPE_NAMES" :key="name">
                    <Button
                        class="border-y-2 border-t-transparent py-1.25"
                        :class="name === activeConfigTypeName ? 'border-b-blue-400' : 'border-b-transparent'"
                        shape="minimal"
                        @click="activeConfigTypeName = name"
                    >
                        <HomeIcon v-if="name === 'Home'" class="size-5! [&>path]:stroke-[1.25]" />
                        <div v-else class="text-sm">{{ name }}</div>
                    </Button>
                </template>
            </div>

            <!-- Body -->
            <div v-if="activeConfigTypeName === 'Home'">Home...</div>
            <div v-if="activeConfigTypeName === 'Connectors'">Connectors...</div>
            <div v-if="activeConfigTypeName === 'Connections'">Connections...</div>
            <ManageContextsPanel v-if="activeConfigTypeName === 'Contexts'" class="flex-1" />
            <div v-if="activeConfigTypeName === 'Presenters'">Presenters...</div>
            <div v-if="activeConfigTypeName === 'Tutorials'">Tutorials...</div>
        </div>
    </WorkbenchLayout>
</template>
