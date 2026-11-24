// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// How far the diagram has been drilled down: every connector, one connector, or one of its connections.
export interface DataViewDiagramFocus {
    connectorId?: string | undefined;
    connectionId?: string | undefined;
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The level the URL names, in the diagram route's path. A part that is left out is empty, which names no level.
export function readDataViewDiagramFocus(parameters: Record<string, unknown>): DataViewDiagramFocus {
    const { connectorId, connectionId } = parameters;
    return { connectorId: readPathPart(connectorId), connectionId: readPathPart(connectionId) };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function readPathPart(part: unknown): string | undefined {
    return typeof part === 'string' && part !== '' ? part : undefined;
}
