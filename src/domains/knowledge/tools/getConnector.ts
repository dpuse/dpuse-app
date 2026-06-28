// ── External Dependencies & Registrations
import { connectorConfigs } from '@/state/session';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface GetConnectorResult {
    id: string;
    label: string | undefined;
    description: string | undefined;
    categoryId: string;

    operations: string[];
    statusId: string | null | undefined;
    vendorHomeURL: string | null;
    vendorDocumentationURL: string | null;
    version: string;
}

// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function executeGetConnector(id: string): GetConnectorResult | { error: string } {
    const c = connectorConfigs.value.find((c) => c.id === id);
    if (!c) return { error: `No connector found with id '${id}'` };
    return {
        id: c.id,
        label: c.label.en ?? c.label.es,
        description: (c.description.en ?? c.description.es ?? []).join('\n\n') || undefined,
        categoryId: c.categoryId,
        operations: c.actionNames,
        statusId: c.statusId,
        vendorHomeURL: c.vendorHomeURL,
        vendorDocumentationURL: c.vendorDocumentationURL,
        version: c.version
    };
}
