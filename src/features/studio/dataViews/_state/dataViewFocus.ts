// ── External Dependencies & Registrations
import type { LocationQuery } from 'vue-router';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// How far the diagram has been drilled down: every connector, one connector, one of its connections, or one folder or
// database of that connection.
export interface DataViewDiagramFocus {
    connectorId?: string | undefined;
    connectionId?: string | undefined;
    folderPath?: string | undefined;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// A folder path holds slashes, and the path's last part is the selected data view, so the folder goes in the query.
const FOLDER_QUERY_KEY = 'folder';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The level the URL names: the connector and connection in the diagram route's path, and the folder in its query. A
// part that is left out is empty, which names no level. A folder is read only with its connection.
export function readDataViewDiagramFocus(parameters: Record<string, unknown>, query: LocationQuery = {}): DataViewDiagramFocus {
    const { connectorId, connectionId } = parameters;
    const focusedConnectionId = readPathPart(connectionId);
    return { connectorId: readPathPart(connectorId), connectionId: focusedConnectionId, folderPath: focusedConnectionId == null ? undefined : readFolderPath(query[FOLDER_QUERY_KEY]) };
}

// The query for a level, which names its folder, or no folder for any other level.
export function constructDataViewDiagramFocusQuery(query: LocationQuery, folderPath: string | undefined): LocationQuery {
    const otherQuery = Object.fromEntries(Object.entries(query).filter(([key]) => key !== FOLDER_QUERY_KEY));
    return folderPath == null ? otherQuery : { ...otherQuery, [FOLDER_QUERY_KEY]: folderPath };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function readPathPart(part: unknown): string | undefined {
    return typeof part === 'string' && part !== '' ? part : undefined;
}

// A file in a file store's top folder has the empty folder path, so an empty folder is a level of its own.
function readFolderPath(part: unknown): string | undefined {
    return typeof part === 'string' ? part : undefined;
}
