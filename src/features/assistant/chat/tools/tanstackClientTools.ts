// ── External Dependencies & Registrations
import { clientTools } from '@tanstack/ai-client';
import { toolDefinition } from '@tanstack/ai/client';

// ── Local Framework
import { executeGetConnection } from './getConnection';
import { executeGetConnector } from './getConnector';
import { executeGetLocalTime } from './getLocalTime';
import { executeListConnections } from './listConnections';
import { executeListConnectorItems } from './listConnectorItems';
import { executeListConnectors } from './listConnectors';
import { executePreviewConnectorItem } from './previewConnectorItem';

// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Client-side tool definitions for the TanStack chat. `getWeather` is executed server-side (see dpuse-api's
// tanstackChat/tools/getWeather.ts) so it is not registered here — only the tools the model must run in the browser.

const getConnectionTool = toolDefinition({
    name: 'getConnection',
    description: 'Get full details for a specific connection by its ID. Use this after listConnections when the user wants to know more about a particular connected account.',
    inputSchema: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'The connection ID. Obtain this from listConnections.' }
        },
        required: ['id']
    }
}).client((arguments_) => executeGetConnection((arguments_ as { id: string }).id));

const getConnectorTool = toolDefinition({
    name: 'getConnector',
    description:
        'Get full details for a specific connector by its ID. A connector is the integration code for a type of data source, not a specific user account. Use this after listConnectors. To see the actual connected accounts, use listConnections.',
    inputSchema: {
        type: 'object',
        properties: {
            id: { type: 'string', description: 'The connector ID' }
        },
        required: ['id']
    }
}).client((arguments_) => executeGetConnector((arguments_ as { id: string }).id));

const getLocalTimeTool = toolDefinition({
    name: 'getLocalTime',
    description: "Get the user's current local time, date, and timezone. Use this when asked about the current time or date.",
    inputSchema: {
        type: 'object',
        properties: {}
    }
}).client(() => executeGetLocalTime());

const listConnectionsTool = toolDefinition({
    name: 'listConnections',
    description:
        "List all of the user's active connections. A connection is a specific account linked to a connector — for example a personal Dropbox account or a work Dropbox account are two separate connections, both using the Dropbox connector. Use this to find connectionIds needed by listConnectorItems and previewConnectorItem.",
    inputSchema: {
        type: 'object',
        properties: {}
    }
}).client(() => executeListConnections());

const listConnectorItemsTool = toolDefinition({
    name: 'listConnectorItems',
    description:
        'List files and folders within a specific connection. A connection is a specific user account linked to a connector (e.g. a personal Dropbox account). Use listConnections first to find the connectionId. Optionally provide a folderPath to list the contents of a subfolder.',
    inputSchema: {
        type: 'object',
        properties: {
            connectionId: { type: 'string', description: 'The connection ID to browse. Obtain this from listConnections.' },
            folderPath: {
                type: 'string',
                description:
                    'The folder path to list. Use an empty string "" for the root. For subfolders use standard directory format, e.g. "/documents" or "/documents/reports". Build the path progressively by appending the folder name to the current path.'
            }
        },
        required: ['connectionId']
    }
}).client((arguments_) => executeListConnectorItems(arguments_));

const listConnectorsTool = toolDefinition({
    name: 'listConnectors',
    description:
        "List all data connectors registered in the workbench. A connector is the integration code that knows how to connect to a type of data source (e.g. a Dropbox connector, a PostgreSQL connector). It is not a specific account connection — use listConnections to see the user's actual connected accounts.",
    inputSchema: {
        type: 'object',
        properties: {}
    }
}).client(() => executeListConnectors());

const previewConnectorItemTool = toolDefinition({
    name: 'previewConnectorItem',
    description:
        'Preview the contents of a file within a specific connection. Returns column names and a sample of rows for tabular data, or raw text for text files. Use listConnections to get the connectionId and listConnectorItems to discover available files.',
    inputSchema: {
        type: 'object',
        properties: {
            connectionId: { type: 'string', description: 'The connection ID that contains the file. Obtain this from listConnections.' },
            path: {
                type: 'string',
                description:
                    'The full path of the file including folder path, name, and extension, e.g. "/documents/report.csv". Construct this from the folderPath, name, and extension returned by listConnectorItems: "{folderPath}/{name}.{extension}".'
            }
        },
        required: ['connectionId', 'path']
    }
}).client((arguments_) => executePreviewConnectorItem(arguments_));

// 'clientTools' rather than a plain array: it captures each tool's literal name and its input and output types, which
// a widened 'AnyClientTool[]' loses — and with them the narrowing that makes a tool part typed at the point of use.
export const tanstackClientTools = clientTools(
    getConnectionTool,
    getConnectorTool,
    getLocalTimeTool,
    listConnectionsTool,
    listConnectorItemsTool,
    listConnectorsTool,
    previewConnectorItemTool
);
