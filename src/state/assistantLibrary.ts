// ── External Dependencies & Registrations
import { computed, type ComputedRef, type WritableComputedRef } from 'vue';
import { type LocationQueryRaw, useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { ignoreReportedNavigationFailure } from '@/router';
import { t } from '@/state/locale';
import { TEXT } from './assistantLibrary_.json';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type LibraryDocumentType = 'connector' | 'context' | 'dataView' | 'document';

// One entry in the library. Declared here because both the library pane and the document panel, which the layout
// hosts, use it.
export interface LibraryDocument {
    id: string;
    type: LibraryDocumentType;
    title: string;
    snippet: string;
    source: string;
}

interface AssistantLibrary {
    // Whether the library pane is open. Held in the URL, so a reload or shared link reopens the library.
    paneIsOpen: WritableComputedRef<boolean>;
    // The breadcrumb trail through the index, as document ids from the root down. Empty at the top level.
    path: ComputedRef<string[]>;
    query: WritableComputedRef<string>;
    searchHasQuery: ComputedRef<boolean>;
    setPath: (path: string[]) => void;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PATH_SEPARATOR = '/';

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// The library's state, held in the URL so a reload or shared link reopens the same search and folder. The search bar
// and the library pane are not parent and child, so the URL is also how both read it. Writes replace the history
// entry, so Back leaves the assistant rather than undoing each keystroke.
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

    const searchHasQuery = computed(() => query.value.trim().length > 0);

    function setPath(newPath: string[]): void {
        replaceQuery({ lPath: newPath.length === 0 ? undefined : newPath.join(PATH_SEPARATOR) });
    }

    function replaceQuery(changes: LocationQueryRaw): void {
        void ignoreReportedNavigationFailure(router.replace({ query: { ...route.query, ...changes } }));
    }

    return { paneIsOpen, path, query, searchHasQuery, setPath };
}

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Shared rather than held with the list: the library labels a row's type and the document panel labels the same type
// again, and the two must not be able to disagree about what a 'dataView' is called.
export const libraryDocumentTypeLabels = computed(
    (): Record<LibraryDocumentType, string> => ({
        connector: t(TEXT, 'connector.label'),
        context: t(TEXT, 'context.label'),
        dataView: t(TEXT, 'dataView.label'),
        document: t(TEXT, 'document.label')
    })
);
