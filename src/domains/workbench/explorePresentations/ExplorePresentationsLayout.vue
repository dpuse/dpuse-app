<script setup lang="ts">
// External Dependencies & Registrations
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Local (App) Framework
import { t } from '@/state/locale';
import T from './ExplorePresentationsLayout.json';

// Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/Input.vue';
import Separator from '@/components/ui/Separator.vue';
import WorkbenchHeader from '@/components/framework/header/WorkbenchHeader.vue';
import WorkbenchLayout from '../WorkbenchLayout.vue';

const route = useRoute();
const router = useRouter();

const documentName = ref('');

function openDocument(): void {
    const slug = documentName.value
        .trim()
        .toLowerCase()
        .replaceAll(/\s+/g, '-')
        .replaceAll(/[^a-z0-9-]/g, '');
    if (!slug) return;
    router.push({ name: 'documentEditor', params: { documentId: slug } });
}
</script>

<template>
    <WorkbenchLayout>
        <WorkbenchHeader class="flex-none px-4" :overline="t(T, 'wb.label')" :title="t(T, 'Explore_Presentations')" to="workbench" />

        <div class="relative flex min-h-0 flex-1 flex-col">
            <Separator class="mx-4" />

            <div v-if="route.name === 'explorePresentations'" class="flex flex-1 flex-col items-center justify-center gap-4 p-8">
                <p class="text-sm text-muted">{{ t(T, 'open_document_heading') }}</p>
                <form class="flex w-full max-w-sm gap-2" @submit.prevent="openDocument">
                    <Input v-model="documentName" class="flex-1" label="Document name" label-hidden :placeholder="t(T, 'open_document_placeholder')" autocomplete="off" />
                    <Button type="submit" variant="primary">{{ t(T, 'open_document_button') }}</Button>
                </form>
            </div>

            <RouterView />
        </div>
    </WorkbenchLayout>
</template>
