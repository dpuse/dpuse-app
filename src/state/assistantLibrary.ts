// ── External Dependencies & Registrations
import { computed, type ComputedRef, type WritableComputedRef } from 'vue';
import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type LibraryDocumentType = 'connector' | 'context' | 'dataView' | 'document';

// One entry in the library. Declared here rather than with the list that renders it, because the panel that opens a
// document is hosted by the layout rather than by the library pane, so both ends need the shape.
export interface LibraryDocument {
    id: string;
    type: LibraryDocumentType;
    title: string;
    snippet: string;
    source: string;
}

interface AssistantLibrary {
    // Whether the library pane is open. Held here rather than only in the pane model so a reload or a shared link
    // reopens on it — and held in one place, because the search control is the library's and showing one without the
    // other is the state this used to be able to reach.
    paneIsOpen: WritableComputedRef<boolean>;
    // The breadcrumb trail through the index, as document ids from the root down. Empty at the top level.
    path: ComputedRef<string[]>;
    query: WritableComputedRef<string>;
    // Searching is what the query decides; there is no separate mode to be out of step with it.
    searchIsActive: ComputedRef<boolean>;
    setPath: (path: string[]) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Shared rather than held with the list: the library labels a row's type and the document panel labels the same type
// again, and the two must not be able to disagree about what a 'dataView' is called.
export const LIBRARY_DOCUMENT_TYPE_LABELS: Record<LibraryDocumentType, string> = {
    connector: 'Connector',
    context: 'Context',
    dataView: 'Data view',
    document: 'Document'
};

const PATH_SEPARATOR = '/';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// The library's state, held in the URL so a reload or a shared link reopens on the same search, filter and trail.
//
// The search bar floats above both panes rather than sitting inside the library, so bar and pane are not parent and
// child and cannot pass this between them. Routing it through the URL is what lets each read the state without either
// owning it — and it has to be in the URL regardless, which is why this is the shared medium rather than a store.
//
// Every write replaces rather than pushes: a search is a refinement of where the user already is, not a place of its
// own, so the back button leaves the assistant rather than walking back through keystrokes.
export function useAssistantLibrary(): AssistantLibrary {
    const route = useRoute();
    const router = useRouter();

    // Closed is the default: the assistant opens on chat alone, so only the open state is written.
    const paneIsOpen = computed({
        get: () => route.query.lState === '1',
        set: (isOpen: boolean) => {
            replaceQuery({ lState: isOpen ? '1' : undefined });
        }
    });

    const path = computed<string[]>(() => {
        const parameter = String(route.query.lPath ?? '');
        return parameter.length === 0 ? [] : parameter.split(PATH_SEPARATOR);
    });

    const query = computed({
        get: () => String(route.query.lQuery ?? ''),
        set: (newQuery: string) => {
            replaceQuery({ lQuery: newQuery.length === 0 ? undefined : newQuery });
        }
    });

    // The query decides, and nothing else does: there is no mode to fall out of step with it.
    const searchIsActive = computed(() => query.value.trim().length > 0);

    function setPath(newPath: string[]): void {
        replaceQuery({ lPath: newPath.length === 0 ? undefined : newPath.join(PATH_SEPARATOR) });
    }

    function replaceQuery(changes: LocationQueryRaw): void {
        void router.replace({ query: { ...route.query, ...changes } }).catch(() => {
            // Already reported by 'router.onError'.
        });
    }

    return { paneIsOpen, path, query, searchIsActive, setPath };
}
