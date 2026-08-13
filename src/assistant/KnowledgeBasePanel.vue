<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref } from 'vue';
import { SearchIcon, XIcon } from '@lucide/vue';

// ── Local Components - Static
import Button from '@/components/ui/button/Button.vue';
import Input from '@/components/ui/Input.vue';
import ScrollArea from '@/components/ui/ScrollArea2.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type KnowledgeBaseModeId = 'index' | 'search';
type DocumentType = 'connector' | 'context' | 'dataView' | 'document';

interface KnowledgeBaseDocument {
    id: string;
    type: DocumentType;
    title: string;
    snippet: string;
    source: string;
}

interface DocumentFilterConfig {
    id: DocumentType | 'all';
    label: string;
}

interface DocumentGroup {
    type: DocumentType;
    label: string;
    documents: KnowledgeBaseDocument[];
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const KNOWLEDGE_BASE_MODES: { id: KnowledgeBaseModeId; label: string }[] = [
    { id: 'index', label: 'Index' },
    { id: 'search', label: 'Search' }
];

const DOCUMENT_FILTERS: DocumentFilterConfig[] = [
    { id: 'all', label: 'All' },
    { id: 'connector', label: 'Connectors' },
    { id: 'dataView', label: 'Data views' },
    { id: 'context', label: 'Context' },
    { id: 'document', label: 'Documents' }
];

const DOCUMENT_TYPE_COLORS: Record<DocumentType, 'amber' | 'green' | 'other' | 'red'> = {
    connector: 'other',
    dataView: 'green',
    context: 'amber',
    document: 'other'
};

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    connector: 'Connector',
    dataView: 'Data view',
    context: 'Context',
    document: 'Document'
};

// TODO: Sample data only. Replace with documents from a knowledge base index/search endpoint once one exists.
const SAMPLE_DOCUMENTS: KnowledgeBaseDocument[] = [
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

const activeModeId = ref<KnowledgeBaseModeId>('index');
const activeFilterId = ref<DocumentFilterConfig['id']>('all');
const query = ref('');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const documentGroups = computed<DocumentGroup[]>(() =>
    DOCUMENT_FILTERS.filter((filter) => filter.id !== 'all').map((filter) => ({
        type: filter.id as DocumentType,
        label: filter.label,
        documents: SAMPLE_DOCUMENTS.filter((document) => document.type === filter.id)
    }))
);

const searchResults = computed<KnowledgeBaseDocument[]>(() => {
    const trimmedQuery = query.value.trim().toLowerCase();

    return SAMPLE_DOCUMENTS.filter((document) => {
        if (activeFilterId.value !== 'all' && document.type !== activeFilterId.value) return false;
        if (trimmedQuery.length === 0) return true;
        return document.title.toLowerCase().includes(trimmedQuery) || document.snippet.toLowerCase().includes(trimmedQuery);
    });
});

const searchHasRun = computed(() => query.value.trim().length > 0 || activeFilterId.value !== 'all');

const resultCountLabel = computed(() => `${searchResults.value.length} result${searchResults.value.length === 1 ? '' : 's'}`);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleClearQuery(): void {
    query.value = '';
}
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col pl-4">
        <!-- Index / Search toggle -->
        <div class="mt-3 flex flex-none gap-x-2 pr-4" role="tablist" aria-label="Knowledge base mode">
            <Button
                v-for="mode in KNOWLEDGE_BASE_MODES"
                :key="mode.id"
                class="flex-none text-sm"
                role="tab"
                :aria-selected="activeModeId === mode.id"
                :variant="activeModeId === mode.id ? 'primary' : 'outline'"
                @click="activeModeId = mode.id"
            >
                {{ mode.label }}
            </Button>
        </div>

        <!-- Index - browse documents grouped by type -->
        <ScrollArea v-if="activeModeId === 'index'" class="mt-3 flex flex-1 flex-col" scroll-area-padding="none">
            <div v-for="group in documentGroups" :key="group.type" class="mb-4">
                <div class="mb-1 text-xs font-medium tracking-wide text-subtle uppercase">{{ group.label }}</div>
                <Button
                    v-for="document in group.documents"
                    :key="document.id"
                    class="flex w-full flex-col items-start border-b border-separator py-2 pr-4 text-left last:border-b-0"
                    shape="minimal"
                >
                    <div class="truncate text-sm font-medium">{{ document.title }}</div>
                    <p class="mt-0.5 text-sm text-muted">{{ document.snippet }}</p>
                    <p class="mt-0.5 text-xs text-subtle">{{ document.source }}</p>
                </Button>
            </div>
        </ScrollArea>

        <!-- Search - find documents by keyword -->
        <template v-else>
            <div class="mt-3 flex items-center gap-x-2 pr-4">
                <SearchIcon aria-hidden="true" class="size-4.5 flex-none text-muted" :stroke-width="1.5" />
                <Input v-model="query" class="flex-1" label="Search" label-hidden placeholder="Search connectors, data views, context and documents…" />
                <Button v-if="query.length > 0" aria-label="Clear search" shape="icon" size="sm" @click="handleClearQuery">
                    <XIcon :stroke-width="1.5" />
                </Button>
            </div>

            <div class="mt-1 pr-4 text-xs text-muted">{{ resultCountLabel }}</div>

            <div class="mt-3 flex flex-none gap-x-2 overflow-x-auto pr-4" role="tablist" aria-label="Document type">
                <Button
                    v-for="filter in DOCUMENT_FILTERS"
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

            <ScrollArea class="mt-3 flex flex-1 flex-col" scroll-area-padding="none">
                <template v-if="searchResults.length > 0">
                    <div v-for="document in searchResults" :key="document.id" class="border-b border-separator py-3 pr-4 first:pt-0">
                        <div class="flex items-center gap-x-2">
                            <Tag :color="DOCUMENT_TYPE_COLORS[document.type]" :text="DOCUMENT_TYPE_LABELS[document.type]" />
                            <div class="truncate text-sm font-medium">{{ document.title }}</div>
                        </div>
                        <p class="mt-1 text-sm text-muted">{{ document.snippet }}</p>
                        <p class="mt-1 text-xs text-subtle">{{ document.source }}</p>
                    </div>
                </template>

                <div v-else class="py-8 text-center text-sm text-muted">
                    {{ searchHasRun ? `No results found.` : 'Enter a search term, or choose a filter, to find connectors, data views, context and documents.' }}
                </div>
            </ScrollArea>
        </template>
    </div>
</template>
