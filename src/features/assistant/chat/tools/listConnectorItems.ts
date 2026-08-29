// ── External Dependencies & Registrations
import { getLocalisedConnection } from '@/state/session';
import { localeId } from '@/state/locale';
import { useEngine } from '@/services/useEngine';
import type { ListNodesOptions, ListNodesResult } from '@dpuse/dpuse-shared/component/module/connector';

// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function executeListConnectorItems(
    arguments_: unknown
): Promise<{ items: { name: string; label: string; typeId: string; folderPath: string; extension: string | undefined; size: number | undefined }[] } | { error: string }> {
    const { connectionId, folderPath = '' } = arguments_ as { connectionId: string; folderPath?: string };

    const connection = getLocalisedConnection(connectionId, localeId.value);
    if (!connection) return { error: `No connection found with id '${connectionId}'` };

    const engine = await useEngine();
    const result = (await engine.processRequest('listNodes', connection, { folderPath } as ListNodesOptions)) as ListNodesResult;

    return {
        items: result.connectionNodeConfigs.map((node) => ({
            name: node.name,
            label: node.label,
            typeId: node.typeId,
            folderPath: node.folderPath,
            extension: node.extension,
            size: node.size
        }))
    };
}
