<script setup lang="ts">
// Local Framework
import { t } from '@/state/locale';
import T from './BuildDataAppsLayout.json';

// Local Components - Static
import ScrollArea from '@/components/ui/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/components/framework/header/StudioHeader.vue';
import StudioLayout from '../StudioLayout.vue';
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-4" :title="t(T, 'Build_Data_Apps')" to="studio" />

        <Separator class="mx-4" />

        <ScrollArea class="flex-1" scroll-area-padding="screen">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <RouterView />
            </div>
        </ScrollArea>
    </StudioLayout>
</template>
