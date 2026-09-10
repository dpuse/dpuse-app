<script setup lang="ts">
// The library half of the assistant split: a breadcrumb-navigated index of what the workspace knows, which becomes a
// flat result list while a search is running. There is no mode switch — the query decides, so the two can never
// disagree about which is showing.
//
// The field and the trail are the index's own header, at the top of the page and inside its scroller, rather than
// chrome floating above it. Each is shown where it is the thing being used: the field at the top level, where starting
// a search is what the pane is for, and the trail wherever there is a position in the index to describe. Opening a
// folder is a commitment to browsing, so it takes the field away and leaves the trail as the way back to it.

// ── External Dependencies & Registrations
import { HouseIcon } from '@lucide/vue';
import { computed, shallowRef } from 'vue';

// ── Local Framework
import type { BreadcrumbConfig } from '@/composables/useBreadcrumbs';
import { LIBRARY_DOCUMENT_TYPE_LABELS, type LibraryDocument, type LibraryDocumentType, useAssistantLibrary } from '@/state/assistantLibrary';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import LibraryDocumentPanel from './LibraryDocumentPanel.vue';
import LibrarySearchInput from './LibrarySearchInput.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The index's folders, one per document type.
interface DocumentFolderConfig {
    id: LibraryDocumentType;
    label: string;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DOCUMENT_FOLDERS: DocumentFolderConfig[] = [
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

// Drawn as a house in the trail, so the wording survives only as the label a reader hears — 'Breadcrumbs' takes its
// 'aria-label' from this whichever way the step is drawn.
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

// The band the pane's two toggles float in, and the gap beneath it. The page starts below the band rather than dodging
// it sideways, which is what lets the header and the list share one column instead of the header carrying insets the
// list does not.
// Spelled as its three terms rather than as one number, because only the middle one can move: the toggles' own 'top-2'
// offset, the 36px a 'sm' icon 'Button' measures ('p-1.75' around a 20px glyph, plus its border), and the same 16px gap
// the lists leave beneath anything above them. Change the toggles' size and this is the line to follow it — it is a
// constant because they are a fixed size, not because the size is arbitrary.
const TOGGLE_BAND_PX = 8 + 36 + 16;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { path, query, searchIsActive, setPath } = useAssistantLibrary();

// The document a row opened, or nothing. Held here rather than by the layout because the panel that shows it covers
// this pane alone.
const activeDocument = shallowRef<LibraryDocument | undefined>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Derived from the trail rather than held beside it, so a link that arrives with a folder in the URL opens on it.
// Checked by membership rather than by indexing: the trail is whatever the URL says, so a hand-edited or stale link can
// name a folder that no longer exists, and that has to fall back to the top level rather than an empty one.
const activeTypeId = computed<LibraryDocumentType | undefined>(() => {
    const [typeId] = path.value;
    return Object.hasOwn(LIBRARY_DOCUMENT_TYPE_LABELS, typeId) ? (typeId as LibraryDocumentType) : undefined;
});

const breadcrumbs = computed<BreadcrumbConfig[]>(() => {
    const items: BreadcrumbConfig[] = [{ id: 'root', icon: HouseIcon, label: ROOT_LABEL }];

    // Built from 'activeTypeId' rather than from the path itself, which is what drops a folder that no longer exists
    // instead of showing it as a step that leads nowhere.
    if (activeTypeId.value) items.push({ id: activeTypeId.value, label: LIBRARY_DOCUMENT_TYPE_LABELS[activeTypeId.value] });

    return items;
});

// Only once a folder is open. At the top level the trail would be a lone home step naming the pane the user is already
// looking at, and the field above it already says what this is — so it earns its place only when there is somewhere to
// go back from. It gives way to a search for the same reason it always did: results are a flat list, and a flat list
// has no position in the index for a trail to describe.
const breadcrumbsAreVisible = computed(() => activeTypeId.value !== undefined && !searchIsActive.value);

// Inside a folder the list is that folder's documents; at the top it is the folders themselves.
const indexDocuments = computed(() => (activeTypeId.value ? SAMPLE_DOCUMENTS.filter((document) => document.type === activeTypeId.value) : []));

const indexFolders = computed(() => DOCUMENT_FOLDERS.map((folder) => ({ ...folder, count: SAMPLE_DOCUMENTS.filter((document) => document.type === folder.id).length })));

// Shown at the top level and nowhere else, which makes it and the trail exact complements: the field is the top
// level's control, the trail is every level below it, and neither appears where the other does. It stays through a
// search, because while one is running this is the only way to read, edit or clear the query.
const searchFieldIsVisible = computed(() => activeTypeId.value === undefined);

const searchResults = computed<LibraryDocument[]>(() => {
    const trimmedQuery = query.value.trim().toLowerCase();
    return SAMPLE_DOCUMENTS.filter((document) => document.title.toLowerCase().includes(trimmedQuery) || document.snippet.toLowerCase().includes(trimmedQuery));
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleCloseDocument(): void {
    activeDocument.value = undefined;
}

function handleOpenDocument(document: LibraryDocument): void {
    activeDocument.value = document;
}

function handleOpenFolder(typeId: LibraryDocumentType): void {
    setPath([typeId]);
}

function handleSelectBreadcrumb(index: number): void {
    setPath(path.value.slice(0, index)); // The root is index 0 and names no folder, so slicing to it empties the trail.
}
</script>

<template>
    <div class="relative flex min-h-0 min-w-0 flex-1 flex-col" data-region="LibraryPanel">
        <!-- 'min-w-0' is load-bearing: this is a flex item of its pane, and a flex item's default 'min-width: auto' is
             its content's minimum, not zero. Without it a long row widens the panel rather than scrolling inside it,
             and the pane overflows the split. -->

        <!-- One scroller for the whole pane, header included, so the field and the trail scroll with the list they
             describe rather than sitting over it. The top reservation is the toggles' own band, which is why it is a
             constant here and no longer a height this pane has to measure and be told about. -->
        <ScrollArea class="flex flex-1 flex-col pl-4" :scroll-area-padding-top="TOGGLE_BAND_PX">
            <!-- Header and list are one column, declared once and on one element, which is also what keeps it one
                 width: 'max-w-prose' is 65ch, and 'ch' resolves against the font size of whatever element carries it,
                 so the same class on a 'text-sm' row would yield a narrower column than on the field above it.
                 The rows carry no right padding of their own — the scroller reserves 16px there for its thumb, which
                 mirrors the 'pl-4' on this side and leaves the column centred on the pane. -->
            <div class="mx-auto max-w-prose">
                <LibrarySearchInput v-if="searchFieldIsVisible" class="mb-3" />

                <!-- The way back to the top level once a folder has taken the field away, which is the whole of its
                     job here — hence its absence at the top level, where there is nothing to go back to. -->
                <Breadcrumbs v-if="breadcrumbsAreVisible" class="pb-3 text-xs" disable-last :items="breadcrumbs" @select="handleSelectBreadcrumb" />

                <!-- Search - a flat list of what matches, whatever folder the index was left on. The trail is kept
                     rather than cleared, so clearing the query returns the user to where they were browsing. -->
                <div v-if="searchIsActive">
                    <ActionWrapper
                        v-for="document in searchResults"
                        :key="document.id"
                        class="flex w-full flex-col items-start border-b border-separator py-3 text-left"
                        @click="handleOpenDocument(document)"
                    >
                        <div class="flex max-w-full items-center gap-x-2">
                            <Tag :color="DOCUMENT_TYPE_COLORS[document.type]" :text="LIBRARY_DOCUMENT_TYPE_LABELS[document.type]" />
                            <div class="truncate text-sm font-medium">{{ document.title }}</div>
                        </div>
                        <p class="mt-1 text-sm text-muted">{{ document.snippet }}</p>
                        <p class="mt-1 text-xs text-subtle">{{ document.source }}</p>
                    </ActionWrapper>

                    <div v-if="searchResults.length === 0" class="py-8 text-center text-sm text-muted">No results found.</div>
                </div>

                <!-- Index - browse by folder, one level deep. -->
                <div v-else>
                    <template v-if="activeTypeId">
                        <ActionWrapper
                            v-for="document in indexDocuments"
                            :key="document.id"
                            class="flex w-full flex-col items-start border-b border-separator py-2 text-left last:border-b-0"
                            @click="handleOpenDocument(document)"
                        >
                            <div class="truncate text-sm font-medium">{{ document.title }}</div>
                            <p class="mt-0.5 text-sm text-muted">{{ document.snippet }}</p>
                            <p class="mt-0.5 text-xs text-subtle">{{ document.source }}</p>
                        </ActionWrapper>
                    </template>

                    <template v-else>
                        <ActionWrapper
                            v-for="folder in indexFolders"
                            :key="folder.id"
                            class="flex w-full items-center justify-between border-b border-separator py-2.5 text-left last:border-b-0"
                            @click="handleOpenFolder(folder.id)"
                        >
                            <span class="truncate text-sm font-medium">{{ folder.label }}</span>
                            <span class="ml-2 flex-none text-xs text-subtle">{{ folder.count }}</span>
                        </ActionWrapper>
                    </template>
                </div>
            </div>
        </ScrollArea>

        <!-- Covers this pane and the toggle floating over it, but stops at the pane's edge: the chat beside it is
             untouched, and the document carries its own close. -->
        <LibraryDocumentPanel
            v-if="activeDocument"
            :snippet="activeDocument.snippet"
            :source="activeDocument.source"
            :title="activeDocument.title"
            :type-label="LIBRARY_DOCUMENT_TYPE_LABELS[activeDocument.type]"
            @close="handleCloseDocument"
        />
    </div>
</template>
