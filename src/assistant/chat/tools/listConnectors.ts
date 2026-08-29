// ── External Dependencies & Registrations
import { connectorConfigs } from '@/state/session';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface ListConnectorsResult {
    connectors: { id: string; label: string | undefined; categoryId: string; statusId: string | null | undefined }[];
}

// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function executeListConnectors(): ListConnectorsResult {
    return {
        connectors: connectorConfigs.value.map((c) => ({
            id: c.id,
            label: c.label.en ?? c.label.es,
            categoryId: c.categoryId,
            statusId: c.statusId
        }))
    };
}
