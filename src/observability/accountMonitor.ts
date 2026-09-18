// ── Local Framework
import { useMonitorSocket } from '@/observability/monitorSocket';
import { accountConfigsAreRetrieved, accountId, type ConnectionAccountConfig, connectionAccountConfigs } from '@/state/session';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface AccountMessage {
    config?: { connections?: ConnectionAccountConfig[] };
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DPU_API_HOST = 'api.dpuse.app';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const socket = useMonitorSocket<AccountMessage>({
    canReconnect: () => accountId.value != null, // Signed out, so there is no account socket to restore.
    isLogged: import.meta.env.DEV || import.meta.env.PROD,
    label: 'Account',
    onDisconnected: () => {
        accountConfigsAreRetrieved.value = false; // Data from a previous connection can't be trusted as current until the next one has proven itself.
    },
    onMessage: (message) => {
        connectionAccountConfigs.value = (message.config?.connections ?? []).map((connection) => ({ connectorId: connection.connectorId }));
        accountConfigsAreRetrieved.value = true;
    },
    retries: -1,
    url: () => `wss://${DPU_API_HOST}/accounts/${String(accountId.value)}/websocket`
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    socket.open();
}

// Sign-out closes the socket on purpose, so a tab being looked at again does not reopen it.
export function terminate(): void {
    socket.close();
}
