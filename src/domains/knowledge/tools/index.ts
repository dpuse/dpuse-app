// ── DPUse Framework
import { executeGetConnection } from './getConnection';
import { executeGetConnector } from './getConnector';
import { executeGetLocalTime } from './getLocalTime';
import { executeListConnections } from './listConnections';
import { executeListConnectorItems } from './listConnectorItems';
import { executeListConnectors } from './listConnectors';
import { executePreviewConnectorItem } from './previewConnectorItem';

// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const toolExecutors: Record<string, (arguments_: unknown) => unknown | Promise<unknown>> = {
    getConnection: (arguments_) => executeGetConnection((arguments_ as { id: string }).id),
    getConnector: (arguments_) => executeGetConnector((arguments_ as { id: string }).id),
    getLocalTime: () => executeGetLocalTime(),
    listConnections: () => executeListConnections(),
    listConnectorItems: (arguments_) => executeListConnectorItems(arguments_),
    listConnectors: () => executeListConnectors(),
    previewConnectorItem: (arguments_) => executePreviewConnectorItem(arguments_)
};
