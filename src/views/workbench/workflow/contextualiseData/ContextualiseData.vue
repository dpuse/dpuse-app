<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workflow/contextualiseData/ContextualiseData.json';

// App Components
import BenchtopShell from '@/components/benchtop/BenchtopShell.vue';
import Header from '@/components/header/Header.vue';

// Properties & Emits
const { displayIsWide } = defineProps<{ displayIsWide: boolean }>();
</script>

<template>
    <BenchtopShell>
        <Header
            :breadcrumbs="[{ id: 'benchtop', label: t(T, 'Workflow_Benchtop') }]"
            :display-is-wide="displayIsWide"
            :title="t(T, 'Contextualise_Data')"
            :workbench-pane-is-hidden="false"
        />

        <RouterView />
    </BenchtopShell>
</template>
