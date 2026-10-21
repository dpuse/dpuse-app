<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './DataAppsPanel_.json';

// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-page" :overline="t(TEXT, 'studio.label')" :title="t(TEXT, 'buildDataApps.title')" :to="{ name: 'studio', query: route.query }" />

        <Separator />

        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)" />
    </StudioLayout>
</template>
