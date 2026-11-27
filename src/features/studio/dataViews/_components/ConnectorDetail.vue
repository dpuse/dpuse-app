<script setup lang="ts">
// ── External Dependencies & Registrations
import { useRoute } from 'vue-router';

// ── Local Framework
import type { DataViewConnection } from '@/features/studio/dataViews/_state/dataViewSummary';
import { t } from '@/state/locale';
import { TEXT } from './ConnectorDetail_.json';

// ── Static Components
import Tag from '@/components/ui/Tag.vue';

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// The connector rows of a details list, shared by the data view and connection documents so the two always agree. The
// connector's page in Setup has the rest of its details, so the name links there.
const { dataViewConnection } = defineProps<{
    dataViewConnection: Pick<DataViewConnection, 'categoryLabel' | 'connectorId' | 'connectorLabel' | 'status' | 'version'>;
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
</script>

<template>
    <!-- Rows only, as 'dt' and 'dd' pairs, so they sit in the caller's list and share its label column and lines. -->
    <dt class="text-muted">{{ t(TEXT, 'connector.label') }}</dt>
    <dd class="m-0 min-w-0 wrap-break-word">
        <RouterLink :to="{ name: 'connectors', params: { id: dataViewConnection.connectorId }, query: route.query }">{{ dataViewConnection.connectorLabel }}</RouterLink>
    </dd>
    <dt class="text-muted">{{ t(TEXT, 'version.label') }}</dt>
    <!-- The version with its release status, unless it is generally available, which has no label, so shows no tag. -->
    <dd class="m-0 flex min-w-0 flex-wrap items-center gap-x-2">
        <span>{{ t(TEXT, 'version.text', { version: dataViewConnection.version }) }}</span>
        <Tag v-if="dataViewConnection.status?.label" :color="dataViewConnection.status.color" :text="dataViewConnection.status.label" />
    </dd>
    <dt class="text-muted">{{ t(TEXT, 'category.label') }}</dt>
    <dd class="m-0 min-w-0 wrap-break-word">{{ dataViewConnection.categoryLabel }}</dd>
</template>
