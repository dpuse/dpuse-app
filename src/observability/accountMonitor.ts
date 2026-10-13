// ── Local Framework
import { accountId } from '@/state/session';
import { DPUSE_API_HOST } from '@/observability/eventTracking';
import { useMonitorSocket } from '@/observability/monitorSocket';
import { accountConfigsAreRetrieved, type ConnectionAccountConfig, connectionAccountConfigs } from '@/state/configs';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface AccountMessage {
    config?: { connections?: ConnectionAccountConfig[] };
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const socket = useMonitorSocket<AccountMessage>({
    canReconnect: () => accountId.value != null, // Signed out, so there is no account socket to restore.
    isLogged: true,
    label: 'Account',
    onDisconnected: () => {
        accountConfigsAreRetrieved.value = false; // Data from a previous connection can't be trusted as current until the next one has proven itself.
    },
    onMessage: (message) => {
        connectionAccountConfigs.value = (message.config?.connections ?? []).map((connection) => ({ connectorId: connection.connectorId }));
        accountConfigsAreRetrieved.value = true;
    },
    retries: -1,
    url: () => `wss://${DPUSE_API_HOST}/accounts/${String(accountId.value)}/websocket`
});

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function initialise(): void {
    socket.open();
}

// Sign-out closes the socket on purpose, so a tab being looked at again does not reopen it.
export function terminate(): void {
    socket.close();
}
