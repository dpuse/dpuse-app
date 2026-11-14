// Only one tab at a time can open a SQLite or DuckDB store. Within a tab, every screen that reads a store shares the one
// the engine opened, so a screen that closed it when it left would pull it from under another. Each screen holds the
// store while it uses it instead, and the last to let go closes it, which frees it for other tabs.
//
// A tab can take a store over from the tab that has it. It then tells the other tabs, so the one that lost the store
// can say so at once rather than when it next reads.

// ── External Dependencies & Registrations
import { useBroadcastChannel } from '@vueuse/core';

// ── DPUse Framework
import type { ConnectionConfig, LocalisedConfig, OpenStoreOptions, OpenStoreResult, StoreStateId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface StoreTakeover {
    connectorId: string;
    takenAt: number; // Makes each takeover a new message, so a second takeover of the same store is still heard.
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const holdCountsByConnectorId = new Map<string, number>();
const usedConnectorIds = new Set<string>(); // Stores this tab has used, so a store it never used is not loaded only to be closed.

const storeTakeoverChannel = useBroadcastChannel<StoreTakeover | undefined, StoreTakeover>({ name: 'dpuse-store-takeover' });

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

export const storeTakeover = storeTakeoverChannel.data; // Undefined until another tab takes a store over. A tab does not hear its own takeovers.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A store connection is one whose connector keeps its data in the browser and must be opened, as SQLite and DuckDB do.
export function isStoreConnection(connectionConfig: Pick<LocalisedConfig<ConnectionConfig>, 'connectorConfig'> | undefined): boolean {
    return connectionConfig?.connectorConfig.actionNames.includes('openStore') === true;
}

// Taking a store over closes it in the tab that had it, which loses any records that tab loaded but has not saved.
export async function openStore(connectorId: string, shouldTakeOver = false): Promise<StoreStateId> {
    usedConnectorIds.add(connectorId);
    const { processRequest } = await establishEngineWorker();
    const options: OpenStoreOptions = shouldTakeOver ? { takeOver: true } : {};
    const { storeStateId } = (await processRequest('openStore', findStoreConnection(connectorId), options)) as OpenStoreResult;
    if (shouldTakeOver && storeStateId === 'ready') storeTakeoverChannel.post({ connectorId, takenAt: Date.now() });
    return storeStateId;
}

// Holding does not open the store. The connector opens it when it is first read, and it stays open until every holder
// has let go. The release can be called more than once, and only the first call counts.
export function holdStore(connectorId: string): () => Promise<void> {
    usedConnectorIds.add(connectorId);
    holdCountsByConnectorId.set(connectorId, (holdCountsByConnectorId.get(connectorId) ?? 0) + 1);
    const release = { isReleased: false };
    return async (): Promise<void> => {
        if (release.isReleased) return;
        release.isReleased = true;
        const holdCount = (holdCountsByConnectorId.get(connectorId) ?? 1) - 1;
        if (holdCount > 0) {
            holdCountsByConnectorId.set(connectorId, holdCount);
            return;
        }
        holdCountsByConnectorId.delete(connectorId);
        await closeStore(connectorId);
    };
}

// Closes the store even while screens hold it, so its database can be deleted. A store this tab never used has nothing
// open, so the engine is not loaded only to close it.
export async function closeStoreForRemoval(connectorId: string): Promise<void> {
    if (usedConnectorIds.has(connectorId)) await closeStore(connectorId);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function closeStore(connectorId: string): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    await processRequest('closeStore', findStoreConnection(connectorId), {});
}

function findStoreConnection(connectorId: string): LocalisedConfig<ConnectionConfig> {
    return assertDefined(findConnectionLocalisedConfig(connectorId), `No connection for store '${connectorId}'.`);
}
