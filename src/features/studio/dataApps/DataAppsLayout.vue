<script setup lang="ts">
// ── Local Framework
import { t } from '@/state/locale';

// ── Static Components
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Separator from '@/components/ui/Separator.vue';
import StudioHeader from '@/features/studio/_components/StudioHeader.vue';
import StudioLayout from '@/features/studio/_components/StudioLayout.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Build_Data_Apps: { en: 'Build Data Apps', es: 'Crear Aplicaciones de Datos' }
};
</script>

<template>
    <StudioLayout>
        <StudioHeader class="flex-none px-4" overline="Studio" :title="t(T, 'Build_Data_Apps')" to="studio" />

        <Separator />

        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <div class="relative flex min-h-0 flex-1 flex-col">
                <RouterView />
            </div>
        </ScrollArea>
    </StudioLayout>
</template>
