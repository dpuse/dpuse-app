<script setup lang="ts">
// External Dependencies
import '@jsonforms/vue-vanilla/vanilla.css';
import { JsonForms } from '@jsonforms/vue';
import { ref } from 'vue';
import { vanillaRenderers } from '@jsonforms/vue-vanilla';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';

// Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../../WorkbenchLayout.vue';

// ─────────────────────────────────────────────────────────────────────────────

const renderers = Object.freeze([...vanillaRenderers]);

const schema = {
    title: 'Organization',
    type: 'object',
    properties: {
        name: { type: 'string', title: 'Organization Name' },
        departments: {
            type: 'array',
            title: 'Departments',
            items: {
                type: 'object',
                title: 'Department',
                properties: {
                    name: { type: 'string', title: 'Department Name' },
                    teams: {
                        type: 'array',
                        title: 'Teams',
                        items: {
                            type: 'object',
                            title: 'Team',
                            properties: {
                                name: { type: 'string', title: 'Team Name' },
                                members: {
                                    type: 'array',
                                    title: 'Members',
                                    items: {
                                        type: 'object',
                                        title: 'Member',
                                        properties: {
                                            name: { type: 'string', title: 'Name' },
                                            role: { type: 'string', title: 'Role' },
                                        },
                                        required: ['name'],
                                    },
                                },
                            },
                            required: ['name'],
                        },
                    },
                },
                required: ['name'],
            },
        },
    },
    required: ['name'],
};

const data = ref({
    name: 'Acme Corp',
    departments: [
        {
            name: 'Engineering',
            teams: [
                {
                    name: 'Frontend',
                    members: [{ name: 'Alice', role: 'Engineer' }],
                },
            ],
        },
    ],
});

const onChange = (event: { data: unknown }): void => {
    data.value = event.data as typeof data.value;
};
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workflow" />

        <div class="relative flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
            <Separator class="mb-4" />
            <JsonForms :schema="schema" :data="data" :renderers="renderers" @change="onChange" />
        </div>
    </WorkbenchLayout>
</template>
