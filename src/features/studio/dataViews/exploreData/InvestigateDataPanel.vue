<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useRoute } from 'vue-router';

// ── Local Framework
import { t } from '@/state/locale';
import { TEXT } from './InvestigateDataPanel_.json';
import { resolveDataViewIdParameter, useDataView } from '@/features/studio/dataViews/_dataViews';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

// ── Data View ─ The audit no longer stores records, and loading them for investigation is not built yet, so an audited
// data view shows a holding message in place of its records.
const { data: dataViewConfig } = useDataView(() => resolveDataViewIdParameter(route.params.dataViewId));
const dataViewIsAudited = computed(() => dataViewConfig.value?.contentAuditConfig != null);
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col" data-region="InvestigateDataPanel">
        <p class="m-auto px-4 text-center text-sm text-muted">{{ t(TEXT, dataViewIsAudited ? 'records.pending.text' : 'audit.required.text') }}</p>

        <!-- Status Bar ─ Blank for now. Keeps the panel's content above the bottom safe area on iOS, as the item preview's
             status bar does. -->
        <div class="h-(--status-bar-height) w-full flex-none border-t border-separator bg-card" />
    </div>
</template>
