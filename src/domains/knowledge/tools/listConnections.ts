// ── External Dependencies & Registrations
import { connectionConfigs } from '@/state/session';

// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function executeListConnections(): { connections: { id: string; label: string | undefined; connectorId: string; statusId: string | null | undefined }[] } {
    return {
        connections: connectionConfigs.value.map((c) => ({
            id: c.id,
            label: c.label.en ?? c.label.es,
            connectorId: c.connectorConfig.id,
            statusId: c.statusId
        }))
    };
}
