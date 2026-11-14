// ── External Dependencies & Registrations
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { closeStoreForRemoval, holdStore, isStoreConnection, openStore } from '@/services/storeUse';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/services/engine', () => ({ establishEngineWorker: vi.fn() }));
vi.mock('@/state/configs', () => ({ findConnectionLocalisedConfig: (id: string): { id: string } => ({ id }) }));

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const processRequest = vi.fn();

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    processRequest.mockReset();
    processRequest.mockResolvedValue({ storeStateId: 'ready' });
    vi.mocked(establishEngineWorker).mockResolvedValue({ initialise: vi.fn(), processRequest });
});

describe('storeUse', () => {
    it('knows a store connection by its connector opening a store', () => {
        expect(isStoreConnection({ connectorConfig: { actionNames: ['listNodes', 'openStore'] } } as never)).toBe(true);
        expect(isStoreConnection({ connectorConfig: { actionNames: ['listNodes'] } } as never)).toBe(false);
        expect(isStoreConnection(undefined)).toBe(false);
    });

    it('closes a store only when the last screen holding it lets go, and counts each release once', async () => {
        const releaseFirst = holdStore('storeA');
        const releaseSecond = holdStore('storeA');

        await releaseFirst();
        await releaseFirst(); // A second call from the same screen does not count again.
        expect(processRequest).not.toHaveBeenCalled();

        await releaseSecond();
        expect(processRequest).toHaveBeenCalledExactlyOnceWith('closeStore', { id: 'storeA' }, {});
    });

    it('asks for a takeover only when the user chose one', async () => {
        await openStore('storeB');
        await openStore('storeB', true);

        expect(processRequest.mock.calls).toStrictEqual([
            ['openStore', { id: 'storeB' }, {}],
            ['openStore', { id: 'storeB' }, { takeOver: true }]
        ]);
    });

    it('closes a store for removal only when this tab has used it, so the engine is not loaded for nothing', async () => {
        await closeStoreForRemoval('storeNeverUsed');
        expect(establishEngineWorker).not.toHaveBeenCalled();

        await openStore('storeC');
        processRequest.mockClear();
        await closeStoreForRemoval('storeC');
        expect(processRequest).toHaveBeenCalledExactlyOnceWith('closeStore', { id: 'storeC' }, {});
    });
});
