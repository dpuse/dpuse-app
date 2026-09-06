<script setup lang="ts">
// The library half of the assistant split: a breadcrumb-navigated index of what the workspace knows, which becomes a
// flat result list while a search is running. There is no mode switch — the query decides, so the two can never
// disagree about which is showing.

// ── External Dependencies & Registrations
import { computed } from 'vue';

// ── Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';
import { type LibraryDocumentType, type LibraryFilterId, useAssistantLibrary } from '@/state/assistantLibrary';

// ── Static Components
import AssistantSearchBar from '../_components/AssistantSearchBar.vue';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface LibraryDocument {
    id: string;
    type: LibraryDocumentType;
    title: string;
    snippet: string;
    source: string;
}

interface DocumentFilterConfig {
    id: LibraryFilterId;
    label: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DOCUMENT_FILTERS: DocumentFilterConfig[] = [
    { id: 'all', label: 'All' },
    { id: 'connector', label: 'Connectors' },
    { id: 'dataView', label: 'Data views' },
    { id: 'context', label: 'Context' },
    { id: 'document', label: 'Documents' }
];

const DOCUMENT_TYPE_COLORS: Record<LibraryDocumentType, 'danger' | 'success' | 'warning' | undefined> = {
    connector: undefined,
    dataView: 'success',
    context: 'warning',
    document: undefined
};

const DOCUMENT_TYPE_LABELS: Record<LibraryDocumentType, string> = {
    connector: 'Connector',
    dataView: 'Data view',
    context: 'Context',
    document: 'Document'
};

// The index's top level: one folder per document type, which is also what the trail's first step names.
const ROOT_LABEL = 'Library';

// TODO: Sample data only. Replace with documents from a knowledge base index/search endpoint once one exists.
const SAMPLE_DOCUMENTS: LibraryDocument[] = [
    {
        id: 'r1',
        type: 'connector',
        title: 'Salesforce',
        snippet: 'Connector configuration for syncing accounts, contacts and opportunities.',
        source: 'Manage Config › Connectors'
    },
    {
        id: 'r2',
        type: 'connector',
        title: 'Google Drive',
        snippet: 'File-store connector used to establish data views over shared documents.',
        source: 'Manage Config › Connectors'
    },
    {
        id: 'r3',
        type: 'dataView',
        title: 'Quarterly Revenue',
        snippet: 'Established data view combining Salesforce opportunities with finance exports.',
        source: 'Establish Data Views'
    },
    { id: 'r4', type: 'dataView', title: 'Support Tickets', snippet: 'Data view over the Zendesk connector, audited and explored on 3 Aug.', source: 'Establish Data Views' },
    { id: 'r5', type: 'context', title: 'Customer', snippet: 'Context model entity describing customer dimensions and descriptors.', source: 'Manage Config › Context' },
    {
        id: 'r6',
        type: 'context',
        title: 'Renewable Energy Targets',
        snippet: 'Dimension tree covering regional renewable-energy policy targets.',
        source: 'Manage Config › Context'
    },
    { id: 'r7', type: 'document', title: 'Onboarding Guide', snippet: 'Step-by-step guide for connecting a first data source and exploring it.', source: 'Library' },
    { id: 'r8', type: 'document', title: 'Renewable Energy Briefing', snippet: 'Summary of the latest developments in renewable energy for Q3.', source: 'Library' }
];

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { filterId, path, query, searchIsActive, setPath } = useAssistantLibrary();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Derived from the trail rather than held beside it, so a link that arrives with a folder in the URL opens on it.
// Checked by membership rather than by indexing: the trail is whatever the URL says, so a hand-edited or stale link can
// name a folder that no longer exists, and that has to fall back to the top level rather than an empty one.
const activeTypeId = computed<LibraryDocumentType | undefined>(() => {
    const [typeId] = path.value;
    return Object.hasOwn(DOCUMENT_TYPE_LABELS, typeId) ? (typeId as LibraryDocumentType) : undefined;
});

const breadcrumbs = computed<BreadcrumbConfig[]>(() => {
    const items: BreadcrumbConfig[] = [{ id: 'root', label: ROOT_LABEL }];
    if (activeTypeId.value) items.push({ id: activeTypeId.value, label: DOCUMENT_TYPE_LABELS[activeTypeId.value] });
    return items;
});

// Inside a folder the list is that folder's documents; at the top it is the folders themselves.
const indexDocuments = computed(() => (activeTypeId.value ? SAMPLE_DOCUMENTS.filter((document) => document.type === activeTypeId.value) : []));

const indexFolders = computed(() =>
    DOCUMENT_FILTERS.filter((filter) => filter.id !== 'all').map((filter) => ({
        id: filter.id as LibraryDocumentType,
        label: filter.label,
        count: SAMPLE_DOCUMENTS.filter((document) => document.type === filter.id).length
    }))
);

const searchResults = computed<LibraryDocument[]>(() => {
    const trimmedQuery = query.value.trim().toLowerCase();

    return SAMPLE_DOCUMENTS.filter((document) => {
        if (filterId.value !== 'all' && document.type !== filterId.value) return false;
        if (trimmedQuery.length === 0) return true;
        return document.title.toLowerCase().includes(trimmedQuery) || document.snippet.toLowerCase().includes(trimmedQuery);
    });
});

const resultCountLabel = computed(() => `${String(searchResults.value.length)} result${searchResults.value.length === 1 ? '' : 's'}`);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleOpenFolder(typeId: LibraryDocumentType): void {
    setPath([typeId]);
}

function handleSelectBreadcrumb(index: number): void {
    setPath(path.value.slice(0, index)); // The root is index 0 and names no folder, so slicing to it empties the trail.
}
</script>

<template>
    <div class="flex min-h-0 min-w-0 flex-1 flex-col pt-2 pl-4" data-region="LibraryPanel">
        <!-- Names the pane, and shares its line with the toggle that opens it. 'h-9' matches the toggle's height so the
             two sit on one baseline, and 'mr-14' keeps the text clear of it — the toggle floats and reserves nothing. -->
        <div class="mr-14 flex h-9 flex-none items-center">
            <h2 class="truncate text-sm font-medium text-emphasis">{{ ROOT_LABEL }}</h2>
        </div>

        <!-- In the flow at the top of this pane rather than floating over both: searching is the library's alone. Below
             the heading and the toggle rather than beside them, so it is free of the corner and can hold the measure the
             results below it are read at. -->
        <div class="mt-2 flex-none pr-4">
            <AssistantSearchBar class="mx-auto max-w-prose" />
        </div>

        <!-- 'min-w-0' is load-bearing: this is a flex item of its pane, and a flex item's default 'min-width: auto' is
             its content's minimum, not zero. Without it the filter row below widens the panel rather than scrolling
             inside it, and the pane overflows the split. -->
        <!-- Search - a flat list of what matches, whatever folder the index was left on. The trail is kept rather than
             cleared, so clearing the query returns the user to where they were browsing. -->
        <template v-if="searchIsActive">
            <div class="mt-3 flex flex-none gap-x-2 overflow-x-auto pr-4" role="tablist" aria-label="Document type">
                <Button
                    v-for="filter in DOCUMENT_FILTERS"
                    :key="filter.id"
                    class="flex-none text-sm"
                    role="tab"
                    :aria-selected="filterId === filter.id"
                    :variant="filterId === filter.id ? 'primary' : 'outline'"
                    @click="filterId = filter.id"
                >
                    {{ filter.label }}
                </Button>
            </div>

            <div class="mt-1 pr-4 text-xs text-muted">{{ resultCountLabel }}</div>

            <ScrollArea class="mt-3 flex flex-1 flex-col">
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

                <div v-else class="py-8 text-center text-sm text-muted">No results found.</div>
            </ScrollArea>
        </template>

        <!-- Index - browse by folder, one level deep. -->
        <template v-else>
            <Breadcrumbs class="mt-3 flex-none pr-4 text-sm" disable-last :items="breadcrumbs" @select="handleSelectBreadcrumb" />

            <ScrollArea class="mt-3 flex flex-1 flex-col">
                <template v-if="activeTypeId">
                    <Button
                        v-for="document in indexDocuments"
                        :key="document.id"
                        class="flex w-full flex-col items-start border-b border-separator py-2 pr-4 text-left last:border-b-0"
                        shape="minimal"
                    >
                        <div class="truncate text-sm font-medium">{{ document.title }}</div>
                        <p class="mt-0.5 text-sm text-muted">{{ document.snippet }}</p>
                        <p class="mt-0.5 text-xs text-subtle">{{ document.source }}</p>
                    </Button>
                </template>

                <template v-else>
                    <Button
                        v-for="folder in indexFolders"
                        :key="folder.id"
                        class="flex w-full items-center justify-between border-b border-separator py-2.5 pr-4 text-left last:border-b-0"
                        shape="minimal"
                        @click="handleOpenFolder(folder.id)"
                    >
                        <span class="truncate text-sm font-medium">{{ folder.label }}</span>
                        <span class="ml-2 flex-none text-xs text-subtle">{{ folder.count }}</span>
                    </Button>
                </template>
            </ScrollArea>
        </template>
    </div>
</template>
