<script setup lang="ts">
// Local Framework
import { t } from '@/state/locale';
import T from './AssembleDimensionsLayout.json';

// Local Components - Static
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/components/framework/header/StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Assemble_Dimensions')" to="workbench" />

        <div class="relative flex min-h-0 flex-1 flex-col">
            <Separator class="mx-4" />
            <RouterView />
        </div>
    </StudioLayout>
</template>
