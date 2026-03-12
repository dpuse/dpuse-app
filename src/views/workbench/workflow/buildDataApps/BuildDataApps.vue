<script setup lang="ts">
// App Core
import { t } from '@/locales';
import T from '@/locales/views/workflow/buildDataApps/BuildDataApps.json';

// App Components
import BenchtopScroller from '@/components/benchtop/BenchtopScroller.vue';
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
            :title="t(T, 'Build_Data_Apps')"
            :workbench-pane-is-hidden="false"
        />

        <BenchtopScroller class="flex-1"></BenchtopScroller>
    </BenchtopShell>
</template>
