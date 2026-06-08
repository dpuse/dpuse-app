<script setup lang="ts">
// External Dependencies
import { ref } from 'vue';
import { createProPlugin, repeater } from '@formkit/pro';
import { defaultConfig, FormKit, FormKitProvider } from '@formkit/vue';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';

// Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../../WorkbenchLayout.vue';

// ─────────────────────────────────────────────────────────────────────────────

const formkitConfig = defaultConfig({
    plugins: [createProPlugin('fk-31be9083d', { repeater })],
    icons: {
        add: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
        remove: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        trash: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/><path d="M9 6V4h6v2"/></svg>',
        arrowUp: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>',
        arrowDown: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>',
        close: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    },
    config: {
        classes: {
            outer: 'mb-0',
            label: 'mb-1 block text-xs font-medium text-muted',
            inner: 'flex items-center rounded border border-boundary bg-surface transition-colors focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20',
            input: 'w-full bg-transparent px-2.5 py-1.5 text-sm text-content outline-none placeholder:text-subtle',
            help: 'mt-1 text-xs text-muted',
            messages: 'mt-1 space-y-0.5',
            message: 'text-xs text-red-500',
            // Repeater-specific sections
            fieldset: 'border-0 p-0 m-0 w-full',
            legend: 'mb-1 block text-xs font-medium text-muted',
            items: 'mt-1 list-none p-0 m-0 space-y-2',
            item: 'flex items-stretch overflow-hidden rounded border border-boundary bg-surface',
            content: 'flex-1 min-w-0 space-y-2 p-3',
            controls: 'flex flex-col items-center justify-center gap-2 border-l border-separator px-2',
            controlLabel: 'sr-only',
        },
    },
});

interface Member { name: string; role: string }
interface Team { name: string; members: Member[] }
interface Department { name: string; teams: Team[] }
interface Organization { name: string; departments: Department[] }

const data = ref<Organization>({
    name: 'Acme Corp',
    departments: [{
        name: 'Engineering',
        teams: [{
            name: 'Frontend',
            members: [{ name: 'Alice', role: 'Engineer' }],
        }],
    }],
});
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workflow" />

        <div class="relative flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <Separator class="mb-4" />

            <FormKitProvider :config="formkitConfig">
                <FormKit v-model="data.name" type="text" label="Organization Name" />

                <FormKit
                    v-model="data.departments"
                    type="repeater"
                    label="Departments"
                    add-label="Add Department"
                    :classes="{ outer: 'mb-0 mt-3' }"
                >
                    <FormKit type="text" name="name" label="Department Name" />

                    <FormKit
                        type="repeater"
                        name="teams"
                        label="Teams"
                        add-label="Add Team"
                        :classes="{ outer: 'mb-0 mt-2 ml-4 border-l-2 border-separator pl-4' }"
                    >
                        <FormKit type="text" name="name" label="Team Name" />

                        <FormKit
                            type="repeater"
                            name="members"
                            label="Members"
                            add-label="Add Member"
                            :classes="{ outer: 'mb-0 mt-2 ml-4 border-l-2 border-boundary-hover pl-4' }"
                        >
                            <FormKit type="text" name="name" label="Name" />
                            <FormKit type="text" name="role" label="Role" />
                        </FormKit>
                    </FormKit>
                </FormKit>
            </FormKitProvider>
        </div>
    </WorkbenchLayout>
</template>

<style scoped>
/* Repeater control buttons — not reachable via FormKit's classes config */
:deep(.formkit-controls) {
    list-style: none;
}
:deep(.formkit-controls li) {
    display: flex;
    align-items: center;
    justify-content: center;
}
:deep(.formkit-controls button) {
    display: flex;
    align-items: center;
    justify-content: center;
    appearance: none;
    background: transparent;
    border: 0;
    cursor: pointer;
    padding: 0.3rem;
    color: var(--fk-color-muted, var(--color-stone-400));
    transition: color 0.15s;
}
:deep(.formkit-controls button:hover) {
    color: var(--color-text-accent);
}
:deep(.formkit-remove-control button:hover),
:deep(li:has(.formkit-remove-icon) button:hover) {
    color: var(--color-red-500);
}
:deep(.formkit-icon) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}
</style>
