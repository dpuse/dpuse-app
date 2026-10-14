// ── Local Framework
import { accountId } from '@/state/session';
import { DPUSE_API_HOST } from '@/observability/eventTracking';
import { useMonitorSocket } from '@/observability/monitorSocket';
import { accountConfigStatus, type ConnectionAccountConfig, connectionAccountConfigs } from '@/state/configs';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// A connection saved before connections had ids has no 'id', and is known by its connector's id.
interface AccountMessage {
    config?: { connections?: (Omit<ConnectionAccountConfig, 'id'> & { id?: string })[] };
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const socket = useMonitorSocket<AccountMessage>({
    canReconnect: () => accountId.value != null, // Signed out, so there is no account socket to restore.
    isLogged: true,
    label: 'Account',
    onDisconnected: () => {
        accountConfigStatus.value = { typeId: 'pending' }; // Data from a previous connection can't be trusted as current until the next one has proven itself.
    },
    onMessage: (message) => {
        connectionAccountConfigs.value = (message.config?.connections ?? []).map((connection) => ({
            connectorId: connection.connectorId,
            id: connection.id ?? connection.connectorId
        }));
        accountConfigStatus.value = { typeId: 'ready' };
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
