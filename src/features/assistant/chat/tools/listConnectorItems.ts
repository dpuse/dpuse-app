// ── DPUse Framework
import { AppError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { getLocalisedConnection } from '@/state/session';
import { raiseFailure } from '@/state/errors';
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

    // Returned rather than thrown, and reported on the way: this tool's region is the conversation, where an error is
    // shown against the message that asked for it. Letting it escape would make an unhandled rejection out of
    // something the chat already knows how to say.
    try {
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
    } catch (error) {
        const failure = raiseFailure(new AppError(`Failed to list items for connection '${connectionId}'.`, 'dpuse-app.tools.listConnectorItems', { typeId: 'handled' }, { cause: error }));
        return { error: serialiseError(failure.error)[0].message };
    }
}
