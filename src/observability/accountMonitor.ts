// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { accountId } from '@/state/session';
import { DPUSE_API_HOST } from '@/observability/eventTracking';
import { raiseAppFailure } from '@/state/errors';
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
    // Raised at app level because no screen shows the account's connections on their own. The failed status stops
    // screens treating a list that may be out of date as current.
    onMessageFailed: (error) => {
        const appError = new AppError('Failed to read an account update from DPUse.', 'dpuse-app.accountMonitor.onMessageFailed', { typeId: 'handled' }, { cause: error });
        accountConfigStatus.value = { typeId: 'failed', failure: raiseAppFailure(appError, { capability: 'account' }) };
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
