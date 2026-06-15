// ── External Dependencies & Registrations
import { connectionConfigs } from '@/state/session';

// ── Tool ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function executeGetConnection(id: string): unknown {
    const c = connectionConfigs.value.find((c) => c.id === id);
    if (!c) return { error: `No connection found with id '${id}'` };
    return {
        id: c.id,
        label: c.label,
        description: c.description,
        connectorId: c.connectorConfig.id,
        connectorLabel: c.connectorConfig.label,
        statusId: c.statusId,
        lastVerifiedAt: c.lastVerifiedAt
    };
}
