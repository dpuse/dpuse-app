// ── DPUse Framework
import { AppError, findStoreErrorId, serialiseError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { raiseFailure } from '@/state/errors';
import { holdStore, isStoreConnection } from '@/services/storeUse';
import type { ListNodesOptions, ListNodesResult } from '@dpuse/dpuse-shared';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Told to the model as the result, so it can tell the user. Not a failure, because the store is only busy elsewhere.
const STORE_HELD_ELSEWHERE_ERROR = 'This database is open in another tab or window. The user can open it here from Data Views, which closes it there.';

// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function executeListConnectorItems(
    arguments_: unknown
): Promise<{ items: { name: string; label: string; typeId: string; folderPath: string; extension: string | null; size: number | null }[] } | { error: string }> {
    const { connectionId, folderPath = '' } = arguments_ as { connectionId: string; folderPath?: string };

    const connection = findConnectionLocalisedConfig(connectionId);
    if (!connection) return { error: `No connection found with id '${connectionId}'` };

    // Returned rather than thrown, and reported on the way: this tool's region is the conversation, where an error is
    // shown against the message that asked for it. Letting it escape would make an unhandled rejection out of
    // something the chat already knows how to say. A connection that is a store is held only while the tool reads it, so
    // the tool never leaves it open and blocking other tabs.
    const releaseStore = isStoreConnection(connection) ? holdStore(connection.connectorConfig.id) : undefined;
    try {
        const engine = await establishEngineWorker();
        const result = (await engine.processRequest('listNodes', connection, { folderPath } as ListNodesOptions)) as ListNodesResult;

        return {
            items: result.connectionNodeConfigs.map((node) => ({
                name: node.name,
                label: node.label,
                typeId: node.typeId,
                folderPath: node.folderPath,
                extension: node.extension ?? null, // Not 'undefined': the chat client rejects a tool result holding 'undefined', so the model gets 'null' instead.
                size: node.size ?? null // Not 'undefined': the chat client rejects a tool result holding 'undefined', so the model gets 'null' instead.
            }))
        };
    } catch (error) {
        if (findStoreErrorId(error) === 'heldElsewhere') return { error: STORE_HELD_ELSEWHERE_ERROR };
        const failure = raiseFailure(
            new AppError(
                `Failed to list items for connection '${connectionId}'.`,
                'dpuse-app.listConnectorItems.executeListConnectorItems',
                { typeId: 'handled' },
                { cause: error }
            )
        );
        return { error: serialiseError(failure.error)[0].message };
    } finally {
        void releaseStore?.().catch((error: unknown) => {
            raiseFailure(new AppError('Failed to close the store.', 'dpuse-app.listConnectorItems.executeListConnectorItems', { typeId: 'handled' }, { cause: error }));
        });
    }
}
