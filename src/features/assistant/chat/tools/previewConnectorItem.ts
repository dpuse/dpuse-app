// ── DPUse Framework
import { AppError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { getLocalisedConnection } from '@/state/session';
import { raiseFailure } from '@/state/errors';
import { localeId } from '@/state/locale';
import type { PreviewConfig } from '@dpuse/dpuse-shared/component/dataView';
import type { PreviewObjectOptions } from '@dpuse/dpuse-shared/component/module/connector';
import { useEngine } from '@/services/useEngine';

// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function executePreviewConnectorItem(arguments_: unknown): Promise<unknown> {
    const { connectionId, path } = arguments_ as { connectionId: string; path: string };

    const connection = getLocalisedConnection(connectionId, localeId.value);
    if (!connection) return { error: `No connection found with id '${connectionId}'` };

    // Returned rather than thrown, and reported on the way: this tool's region is the conversation, where an error is
    // shown against the message that asked for it. Letting it escape would make an unhandled rejection out of
    // something the chat already knows how to say.
    try {
        const engine = await useEngine();
        const options: PreviewObjectOptions = { chunkSize: undefined, extension: undefined, path };
        const previewConfig = (await engine.processRequest('previewObject', connection, options)) as PreviewConfig;

        if (previewConfig.errorMessage != null) return { error: previewConfig.errorMessage };

        const columnNames = previewConfig.columnConfigs.map((col, index) => col.label.en ?? col.label.es ?? String(index));

        const dataOffset = (previewConfig.hasHeaders ?? false) ? 1 : 0;
        const sampleRows = previewConfig.parsedRecords
            .slice(dataOffset, dataOffset + 10)
            .map((record) => Object.fromEntries(record.map((cell, index) => [columnNames[index] ?? String(index), cell.value])));

        return {
            dataFormatId: previewConfig.dataFormatId,
            size: previewConfig.size,
            columns: columnNames,
            rows: sampleRows,
            text: previewConfig.text
        };
    } catch (error) {
        const failure = raiseFailure(new AppError(`Failed to preview '${path}'.`, 'dpuse-app.tools.previewConnectorItem', { typeId: 'handled' }, { cause: error }));
        return { error: serialiseError(failure.error)[0].message };
    }
}
