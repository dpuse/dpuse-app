// ── DPUse Framework
import { AppError, findStoreErrorId, serialiseError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { raiseFailure } from '@/state/errors';
import { holdStore, isStoreConnection } from '@/services/storeUse';
import type { PreviewObjectOptions, PreviewObjectResult } from '@dpuse/dpuse-shared';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Told to the model as the result, so it can tell the user. Not a failure, because the store is only busy elsewhere.
const STORE_HELD_ELSEWHERE_ERROR = 'This database is open in another tab or window. The user can open it here from Data Views, which closes it there.';

// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function executePreviewConnectorItem(arguments_: unknown): Promise<unknown> {
    const { connectionId, path } = arguments_ as { connectionId: string; path: string };

    const connection = findConnectionLocalisedConfig(connectionId);
    if (!connection) return { error: `No connection found with id '${connectionId}'` };

    // Returned rather than thrown, and reported on the way: this tool's region is the conversation, where an error is
    // shown against the message that asked for it. Letting it escape would make an unhandled rejection out of
    // something the chat already knows how to say. A connection that is a store is held only while the tool reads it, so
    // the tool never leaves it open and blocking other tabs.
    const releaseStore = isStoreConnection(connection) ? holdStore(connection.connectorConfig.id) : undefined;
    try {
        const engine = await establishEngineWorker();
        const options: PreviewObjectOptions = {
            chunkSize: undefined,
            dataFormatId: undefined,
            encodingId: undefined,
            extension: undefined,
            mimeType: undefined,
            parserId: undefined,
            path,
            valueDelimiterId: undefined
        }; // The assistant names only a path, so the extension decides the format and the first tool that reads it parses it.
        const { contentAuditConfig, readingConfig, sampleConfig } = (await engine.processRequest('previewObject', connection, options)) as PreviewObjectResult;

        const columnNames = contentAuditConfig.columns.map((col, index) => col.label.en ?? col.label.es ?? String(index));

        const dataOffset = (readingConfig.hasHeaders ?? false) ? 1 : 0;
        const sampleRows = sampleConfig.parsedRecords
            .slice(dataOffset, dataOffset + 10)
            .map((record) => Object.fromEntries(record.map((cell, index) => [columnNames[index] ?? String(index), cell.value])));

        return {
            dataFormatId: readingConfig.dataFormatId,
            size: sampleConfig.size,
            columns: columnNames,
            rows: sampleRows,
            text: sampleConfig.text
        };
    } catch (error) {
        if (findStoreErrorId(error) === 'heldElsewhere') return { error: STORE_HELD_ELSEWHERE_ERROR };
        const failure = raiseFailure(
            new AppError(`Failed to preview '${path}'.`, 'dpuse-app.previewConnectorItem.executePreviewConnectorItem', { typeId: 'handled' }, { cause: error })
        );
        return { error: serialiseError(failure.error)[0].message };
    } finally {
        void releaseStore?.().catch((error: unknown) => {
            raiseFailure(new AppError('Failed to close the store.', 'dpuse-app.previewConnectorItem.executePreviewConnectorItem', { typeId: 'handled' }, { cause: error }));
        });
    }
}
