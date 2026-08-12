<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref, watch } from 'vue';
import { SearchIcon, XIcon } from '@lucide/vue';

// ── Local Components - Static
import AssistantHeader from './AssistantHeader.vue';
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/Input.vue';
import ScrollArea from '@/components/ui/ScrollArea2.vue';
import Separator from '@/components/ui/Separator.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Options, Properties, Model Value, Slots & Emits ──────────────────────────────────────────────────────────────────

const { title } = defineProps<{ title: string }>();

const emit = defineEmits<{ statusChange: [status: string] }>();

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type ResultType = 'connector' | 'context' | 'dataView' | 'document';

interface SearchResult {
    id: string;
    type: ResultType;
    title: string;
    snippet: string;
    source: string;
}

interface ResultFilterConfig {
    id: ResultType | 'all';
    label: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const RESULT_FILTERS: ResultFilterConfig[] = [
    { id: 'all', label: 'All' },
    { id: 'connector', label: 'Connectors' },
    { id: 'dataView', label: 'Data views' },
    { id: 'context', label: 'Context' },
    { id: 'document', label: 'Documents' }
];

const RESULT_TYPE_COLORS: Record<ResultType, 'amber' | 'green' | 'other' | 'red'> = {
    connector: 'other',
    dataView: 'green',
    context: 'amber',
    document: 'other'
};

const RESULT_TYPE_LABELS: Record<ResultType, string> = {
    connector: 'Connector',
    dataView: 'Data view',
    context: 'Context',
    document: 'Document'
};

// TODO: Sample data only. Replace with results from a search endpoint once one exists.
const SAMPLE_RESULTS: SearchResult[] = [
    { id: 'r1', type: 'connector', title: 'Salesforce', snippet: 'Connector configuration for syncing accounts, contacts and opportunities.', source: 'Manage Config › Connectors' },
    { id: 'r2', type: 'connector', title: 'Google Drive', snippet: 'File-store connector used to establish data views over shared documents.', source: 'Manage Config › Connectors' },
    { id: 'r3', type: 'dataView', title: 'Quarterly Revenue', snippet: 'Established data view combining Salesforce opportunities with finance exports.', source: 'Establish Data Views' },
    { id: 'r4', type: 'dataView', title: 'Support Tickets', snippet: 'Data view over the Zendesk connector, audited and explored on 3 Aug.', source: 'Establish Data Views' },
    { id: 'r5', type: 'context', title: 'Customer', snippet: 'Context model entity describing customer dimensions and descriptors.', source: 'Manage Config › Context' },
    { id: 'r6', type: 'context', title: 'Renewable Energy Targets', snippet: 'Dimension tree covering regional renewable-energy policy targets.', source: 'Manage Config › Context' },
    { id: 'r7', type: 'document', title: 'Onboarding Guide', snippet: 'Step-by-step guide for connecting a first data source and exploring it.', source: 'Library' },
    { id: 'r8', type: 'document', title: 'Renewable Energy Briefing', snippet: 'Summary of the latest developments in renewable energy for Q3.', source: 'Library' }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeFilterId = ref<ResultFilterConfig['id']>('all');
const query = ref('');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const results = computed<SearchResult[]>(() => {
    const trimmedQuery = query.value.trim().toLowerCase();

    return SAMPLE_RESULTS.filter((result) => {
        if (activeFilterId.value !== 'all' && result.type !== activeFilterId.value) return false;
        if (trimmedQuery.length === 0) return true;
        return result.title.toLowerCase().includes(trimmedQuery) || result.snippet.toLowerCase().includes(trimmedQuery);
    });
});

const searchHasRun = computed(() => query.value.trim().length > 0 || activeFilterId.value !== 'all');

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

watch(results, (newResults) => emit('statusChange', `${newResults.length} result${newResults.length === 1 ? '' : 's'}`), { immediate: true });

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClearQuery(): void {
    query.value = '';
}
</script>

<template>
    <div class="flex h-full flex-col">
        <AssistantHeader class="mx-4 flex-none" :title="title" />

        <Separator class="mx-4" />

        <div class="flex min-h-0 flex-1 flex-col pl-4">
            <!-- Search Bar -->
            <div class="mt-3 flex items-center gap-x-2 pr-4">
                <SearchIcon aria-hidden="true" class="size-4.5 flex-none text-muted" :stroke-width="1.5" />
                <Input v-model="query" class="flex-1" label="Search" label-hidden placeholder="Search connectors, data views, context and documents…" />
                <Button v-if="query.length > 0" aria-label="Clear search" shape="icon" size="sm" @click="handleClearQuery">
                    <XIcon :stroke-width="1.5" />
                </Button>
            </div>

            <!-- Filters -->
            <div class="mt-3 flex flex-none gap-x-2 overflow-x-auto pr-4" role="tablist" aria-label="Result type">
                <Button
                    v-for="filter in RESULT_FILTERS"
                    :key="filter.id"
                    class="flex-none text-sm"
                    role="tab"
                    :aria-selected="activeFilterId === filter.id"
                    :variant="activeFilterId === filter.id ? 'primary' : 'outline'"
                    @click="activeFilterId = filter.id"
                >
                    {{ filter.label }}
                </Button>
            </div>

            <!-- Results -->
            <ScrollArea class="mt-3 flex flex-1 flex-col" scroll-area-padding="none">
                <template v-if="results.length > 0">
                    <div v-for="result in results" :key="result.id" class="border-b border-separator py-3 pr-4 first:pt-0">
                        <div class="flex items-center gap-x-2">
                            <Tag :color="RESULT_TYPE_COLORS[result.type]" :text="RESULT_TYPE_LABELS[result.type]" />
                            <div class="truncate text-sm font-medium">{{ result.title }}</div>
                        </div>
                        <p class="mt-1 text-sm text-muted">{{ result.snippet }}</p>
                        <p class="mt-1 text-xs text-subtle">{{ result.source }}</p>
                    </div>
                </template>

                <div v-else class="py-8 text-center text-sm text-muted">
                    {{ searchHasRun ? `No results found.` : 'Enter a search term, or choose a filter, to find connectors, data views, context and documents.' }}
                </div>
            </ScrollArea>
        </div>
    </div>
</template>
