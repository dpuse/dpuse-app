<script setup lang="ts">
// The library half of the assistant split: a breadcrumb-navigated index of what the workspace knows, which becomes a
// flat result list while a search is running. There is no mode switch — the query decides, so the two can never
// disagree about which is showing.

// ── External Dependencies & Registrations
import { computed, ref, shallowRef } from 'vue';

// ── Local Framework
import { LIBRARY_DOCUMENT_TYPE_LABELS, type LibraryDocument, type LibraryDocumentType, useAssistantLibrary } from '@/state/assistantLibrary';

// ── Static Components
import Button from '@/components/ui/button/Button.vue';
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

// Matches the gap the chat panel leaves between its thread and the controls floating at either end of it.
const CONTENT_GAP_PX = 16;
const SEARCH_BAR_TOP_INSET_PX = 8; // 'top-2' on the bar below.

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

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

// Whether the chat pane has been closed, which leaves its toggle floating over this pane instead of its own. The mirror
// of 'studioPaneIsHidden' in the chat panel, and needed for the same reason: a control pinned to a corner of the row
// belongs to whichever pane happens to reach that corner.
const { chatPaneIsHidden } = defineProps<{ chatPaneIsHidden?: boolean }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const { path, query, searchIsActive, setPath } = useAssistantLibrary();

// The document a row opened, or nothing. Held here rather than by the layout because the panel that shows it covers
// this pane alone.
const activeDocument = shallowRef<LibraryDocument | undefined>();

const searchBarHeight = ref(0);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Derived from the trail rather than held beside it, so a link that arrives with a folder in the URL opens on it.
// Checked by membership rather than by indexing: the trail is whatever the URL says, so a hand-edited or stale link can
// name a folder that no longer exists, and that has to fall back to the top level rather than an empty one.
const activeTypeId = computed<LibraryDocumentType | undefined>(() => {
    const [typeId] = path.value;
    return Object.hasOwn(LIBRARY_DOCUMENT_TYPE_LABELS, typeId) ? (typeId as LibraryDocumentType) : undefined;
});

// Inside a folder the list is that folder's documents; at the top it is the folders themselves.
const indexDocuments = computed(() => (activeTypeId.value ? SAMPLE_DOCUMENTS.filter((document) => document.type === activeTypeId.value) : []));

const indexFolders = computed(() => DOCUMENT_FOLDERS.map((folder) => ({ ...folder, count: SAMPLE_DOCUMENTS.filter((document) => document.type === folder.id).length })));

const searchResults = computed<LibraryDocument[]>(() => {
    const trimmedQuery = query.value.trim().toLowerCase();
    return SAMPLE_DOCUMENTS.filter((document) => document.title.toLowerCase().includes(trimmedQuery) || document.snippet.toLowerCase().includes(trimmedQuery));
});

// The bar floats over the list, so the list reserves its space rather than sitting below it — which is what lets the
// content scroll up behind it, as the chat thread does behind its own controls.
const scrollPaddingTop = computed(() => `${String(SEARCH_BAR_TOP_INSET_PX + searchBarHeight.value + CONTENT_GAP_PX)}px`);

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
</script>

<template>
    <!-- 'min-w-0' is load-bearing: this is a flex item of its pane, and a flex item's default 'min-width: auto' is its
         content's minimum, not zero. Without it a long row widens the panel rather than scrolling inside it, and the
         pane overflows the split. -->
    <div class="@container relative flex min-h-0 min-w-0 flex-1 flex-col" data-region="LibraryPanel">
        <!-- '@container' for the same reason 'ChatPanel' declares its own: the search bar's width is a question about
             the room this pane has, and this pane is one half of a split nested inside another split, so its width
             changes whenever either splitter moves and no viewport breakpoint ever reports that. -->
        <!-- Floats over the list rather than sitting above it, so the content scrolls up behind it the way the chat
             thread does behind its own controls.
             'right-18' clears the library's own toggle, which ends 56px in, leaving the same 16px gap the lists leave
             beneath it. The left inset answers the same question about the chat's toggle, which is pinned to the row's
             left corner rather than to a pane: with the chat open that corner is the chat's, and this can start at the
             rows' own margin; with the chat closed this pane reaches the corner and has to clear the toggle by the
             same 16px, so the two ends stay symmetrical.
             No heading beside it — the field's placeholder names what this pane holds, and the trail below starts at a
             home icon that says the same thing more briefly.
             Capped to the same measure as the lists beneath it and as the composer in the other pane, so the three read
             as one column rather than three widths. 'max-w' rather than a width, as the composer does it: the field
             still fills the inset box while the pane is narrow, and the auto margins centre it once the cap bites.
             '@xl:left-18' is what keeps the centring honest. The insets are collision bounds — the field has to clear
             the library's toggle on the right, and the chat's on the left once this pane reaches that corner — but they
             are asymmetric while the chat is open, and centring inside an asymmetric box would sit the field half the
             difference off the column below it. The box goes symmetric at '@xl' (576px), below the 664px this pane
             needs before a 65ch cap can bite at all, so by the time the auto margins do anything the axis they centre
             on is the pane's own. -->
        <LibrarySearchInput
            :class="['absolute top-2 right-18 z-10 mx-auto max-w-prose', chatPaneIsHidden ? 'left-18' : 'left-4 @xl:left-18']"
            @height-change="searchBarHeight = $event"
        />

        <!-- Search - a flat list of what matches, whatever folder the index was left on. The trail is kept rather than
             cleared, so clearing the query returns the user to where they were browsing. -->
        <template v-if="searchIsActive">
            <ScrollArea class="flex flex-1 flex-col pl-4" :scroll-area-padding-top="scrollPaddingTop">
                <!-- Held to the same measure as the field floating above it and as the chat thread beside it. Declared
                     here rather than on each row so the rules between them are one column's width rather than each
                     row's, and so the cap resolves against one font size: 'max-w-prose' is 65ch, and 'ch' is relative
                     to whatever element carries it, so the same class on a 'text-sm' row would be a narrower column.
                     The rows carry no right padding of their own — the scroller reserves 16px there for its thumb,
                     which mirrors the 'pl-4' on this side and leaves the column centred on the pane. -->
                <div class="mx-auto max-w-prose">
                    <template v-if="searchResults.length > 0">
                        <Button
                            v-for="document in searchResults"
                            :key="document.id"
                            class="flex w-full flex-col items-start border-b border-separator py-3 text-left first:pt-0"
                            shape="minimal"
                            @click="handleOpenDocument(document)"
                        >
                            <div class="flex max-w-full items-center gap-x-2">
                                <Tag :color="DOCUMENT_TYPE_COLORS[document.type]" :text="LIBRARY_DOCUMENT_TYPE_LABELS[document.type]" />
                                <div class="truncate text-sm font-medium">{{ document.title }}</div>
                            </div>
                            <p class="mt-1 text-sm text-muted">{{ document.snippet }}</p>
                            <p class="mt-1 text-xs text-subtle">{{ document.source }}</p>
                        </Button>
                    </template>

                    <div v-else class="py-8 text-center text-sm text-muted">No results found.</div>
                </div>
            </ScrollArea>
        </template>

        <!-- Index - browse by folder, one level deep. -->
        <template v-else>
            <ScrollArea class="flex flex-1 flex-col pl-4" :scroll-area-padding-top="scrollPaddingTop">
                <!-- The same column the results use, for the same reasons, so switching between the two changes what
                     is listed rather than how wide the pane's content is. -->
                <div class="mx-auto max-w-prose">
                    <template v-if="activeTypeId">
                        <Button
                            v-for="document in indexDocuments"
                            :key="document.id"
                            class="flex w-full flex-col items-start border-b border-separator py-2 text-left last:border-b-0"
                            shape="minimal"
                            @click="handleOpenDocument(document)"
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
                            class="flex w-full items-center justify-between border-b border-separator py-2.5 text-left last:border-b-0"
                            shape="minimal"
                            @click="handleOpenFolder(folder.id)"
                        >
                            <span class="truncate text-sm font-medium">{{ folder.label }}</span>
                            <span class="ml-2 flex-none text-xs text-subtle">{{ folder.count }}</span>
                        </Button>
                    </template>
                </div>
            </ScrollArea>
        </template>

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
