// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DPU_API_HOST = 'api.dpuse.app';
const TIMEOUT_DELAY = 5000;

// Local State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let accountId: string | undefined;
let webSocket: WebSocket | undefined;
let webSocketShutdown = false;

// Actions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function initialise(userId: string): void {
    accountId = userId;
    if (!(webSocket && (webSocket.readyState === WebSocket.CONNECTING || webSocket.readyState === WebSocket.OPEN))) {
        webSocket = connectToWebSocket();
        window.addEventListener('beforeunload', () => shutdown());
    }
}

export function terminate(): void {
    shutdown();
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function connectToWebSocket(): WebSocket | undefined {
    try {
        const url = `wss://${DPU_API_HOST}/accounts/${accountId}/websocket`;
        let pendingWebSocket: WebSocket | undefined = new WebSocket(url);

        pendingWebSocket.addEventListener('open', () => {
            if (import.meta.env.DEV) console.info('[dpuse:app] ✅ Accounts WebSocket connection established.');
        });

        pendingWebSocket.addEventListener('message', (event) => {
            try {
                const eventData = JSON.parse(event.data);
                console.log(eventData);
            } catch (error) {
                if (import.meta.env.DEV) console.info(`[dpuse:app] ❌ Account configuration retrieval error: ${String(error)}`, error);
            }
        });

        pendingWebSocket.addEventListener('close', (event) => {
            if (import.meta.env.DEV) console.info(`[dpuse:app] ⚠️ Accounts WebSocket close event '${event.code}' received.`);
            pendingWebSocket = undefined;
            if (!webSocketShutdown) setTimeout(connectToWebSocket, TIMEOUT_DELAY);
        });

        pendingWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            if (import.meta.env.DEV) console.info(`[dpuse:app] ❌ Accounts WebSocket operational error: ${String(error)}`, error);
        });

        return pendingWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        if (import.meta.env.DEV) console.info(`[dpuse:app] ❌ Accounts WebSocket creation error: ${String(error)}`, error);
        return undefined;
    }
}

function shutdown(): void {
    webSocketShutdown = true;
    if (webSocket) {
        webSocket.close();
        webSocket = undefined;
    }
}
