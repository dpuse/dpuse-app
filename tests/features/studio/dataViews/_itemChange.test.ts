// ── External Dependencies & Registrations
import { effectScope } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import type { ConnectionNodeConfig, DataViewConfig, EngineWorker } from '@dpuse/dpuse-shared';

// ── Local Framework
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { settle } from '~/tests/support/settle';
import { areItemColumnsUnchanged, compareItemVersions, findCurrentItemConfig } from '@/features/studio/dataViews/_itemChange';
import { ignoreItemChange, isItemChangeIgnored } from '@/features/studio/dataViews/_itemChange';
import { useItemChange, wasItemRefreshRequested } from '@/features/studio/dataViews/_itemChange';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/services/engine', () => ({ establishEngineWorker: vi.fn() }));
vi.mock('@/state/configs', () => ({ findConnectionLocalisedConfig: vi.fn() }));

const processRequest = vi.fn<EngineWorker['processRequest']>();

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONNECTION_CONFIG = { id: 'source1' };
const SAVED_ITEM_CONFIG = buildItemConfig('sales.csv', 1);

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    vi.mocked(establishEngineWorker).mockResolvedValue({ processRequest } as unknown as Awaited<ReturnType<typeof establishEngineWorker>>);
    vi.mocked(findConnectionLocalisedConfig).mockReturnValue(CONNECTION_CONFIG as ReturnType<typeof findConnectionLocalisedConfig>);
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('findCurrentItemConfig', () => {
    it('lists the item’s folder and returns the item as it is listed now', async () => {
        processRequest.mockResolvedValueOnce({ connectionNodeConfigs: [buildItemConfig('other.csv', 5), buildItemConfig('sales.csv', 2)], totalCount: 2 });

        await expect(findCurrentItemConfig('source1', SAVED_ITEM_CONFIG)).resolves.toMatchObject({ lastModifiedAt: 2, name: 'sales.csv' });
        expect(processRequest).toHaveBeenCalledWith('listNodes', CONNECTION_CONFIG, { folderPath: '/data', limit: 500, offset: 0 });
    });

    it('lists further pages of a large folder until it finds the item', async () => {
        const firstPage = Array.from({ length: 500 }, (_, index) => buildItemConfig(`other${String(index)}.csv`, 1));
        processRequest.mockResolvedValueOnce({ connectionNodeConfigs: firstPage, totalCount: 501 });
        processRequest.mockResolvedValueOnce({ connectionNodeConfigs: [buildItemConfig('sales.csv', 2)], totalCount: 501 });

        await expect(findCurrentItemConfig('source1', SAVED_ITEM_CONFIG)).resolves.toMatchObject({ lastModifiedAt: 2 });
        expect(processRequest).toHaveBeenLastCalledWith('listNodes', CONNECTION_CONFIG, { folderPath: '/data', limit: 500, offset: 500 });
    });

    it('returns nothing when the folder no longer holds the item, or the connection is gone', async () => {
        processRequest.mockResolvedValueOnce({ connectionNodeConfigs: [buildItemConfig('other.csv', 5)], totalCount: 1 });
        await expect(findCurrentItemConfig('source1', SAVED_ITEM_CONFIG)).resolves.toBeUndefined();

        vi.mocked(findConnectionLocalisedConfig).mockReturnValueOnce(undefined);
        await expect(findCurrentItemConfig('source1', SAVED_ITEM_CONFIG)).resolves.toBeUndefined();
    });
});

describe('compareItemVersions', () => {
    it('says the item has changed when its last-modified time differs from the read one, and is unchanged when it matches', () => {
        expect(compareItemVersions(1, buildItemConfig('sales.csv', 2))).toBe('changed');
        expect(compareItemVersions(1, buildItemConfig('sales.csv', 1))).toBe('unchanged');
    });

    it('cannot tell without a last-modified time on both, or without the item', () => {
        expect(compareItemVersions(1, buildItemConfig('sales.csv', undefined))).toBe('unknown');
        expect(compareItemVersions(undefined, buildItemConfig('sales.csv', 2))).toBe('unknown');
        expect(compareItemVersions(1, undefined)).toBe('unknown');
    });
});

describe('ignoreItemChange', () => {
    it('ignores a change to one data view’s item at one version only', () => {
        const changedItemConfig = buildItemConfig('sales.csv', 2);
        ignoreItemChange('dataView1', changedItemConfig);

        expect(isItemChangeIgnored('dataView1', changedItemConfig)).toBe(true);
        expect(isItemChangeIgnored('dataView1', buildItemConfig('sales.csv', 3))).toBe(false);
        expect(isItemChangeIgnored('dataView2', changedItemConfig)).toBe(false);
    });
});

describe('areItemColumnsUnchanged', () => {
    it('compares the header records value by value', () => {
        const readColumns = { columnCount: 2, headerValues: ['Id', 'Day'] };

        expect(areItemColumnsUnchanged(readColumns, { columnCount: 2, headerValues: ['Id', 'Day'] })).toBe(true);
        expect(areItemColumnsUnchanged(readColumns, { columnCount: 2, headerValues: ['Day', 'Id'] })).toBe(false); // Moved.
        expect(areItemColumnsUnchanged(readColumns, { columnCount: 3, headerValues: ['Id', 'Day', 'Amount'] })).toBe(false); // Added.
    });

    it('compares only the number of columns without headers, and never matches headers with none', () => {
        const readColumns = { columnCount: 2, headerValues: undefined };

        expect(areItemColumnsUnchanged(readColumns, { columnCount: 2, headerValues: undefined })).toBe(true);
        expect(areItemColumnsUnchanged(readColumns, { columnCount: 3, headerValues: undefined })).toBe(false);
        expect(areItemColumnsUnchanged(readColumns, { columnCount: 2, headerValues: ['Id', 'Day'] })).toBe(false);
    });
});

describe('wasItemRefreshRequested', () => {
    it('takes the refresh Explore asked for once, keeping the rest of the history entry', () => {
        history.replaceState({ itemRefreshIsRequested: true, other: 1 }, '');

        expect(wasItemRefreshRequested()).toBe(true);
        expect(wasItemRefreshRequested()).toBe(false);
        expect(history.state).toMatchObject({ other: 1 });
        history.replaceState(null, '');
    });
});

// Each test checks an item of its own, because a check is reused for a while. An ignored change is kept for the page, by
// data view and version.
describe('useItemChange', () => {
    it('says the item has changed since the data view read it, until the user ignores the change', async () => {
        processRequest.mockResolvedValue({ connectionNodeConfigs: [buildItemConfig('changed.csv', 50)], totalCount: 1 }); // A version no other test ignores.
        const scope = effectScope();
        const itemChange = scope.run(() => useItemChange(() => buildDataViewConfig('changed.csv')));

        expect(itemChange?.itemChangeId.value).toBeUndefined(); // Not known until the source has been checked.
        await settle();
        expect(itemChange?.itemChangeId.value).toBe('changed');
        expect(itemChange?.itemChangedAt.value).toBe(50);
        expect(itemChange?.itemChangeIsShown.value).toBe(true);

        itemChange?.ignoreItemChange();
        expect(itemChange?.itemChangeIsShown.value).toBe(false);
        scope.stop();
    });

    it('shows nothing for an item at the version the data view read, or whose source gives no last-modified time', async () => {
        processRequest.mockResolvedValueOnce({ connectionNodeConfigs: [buildItemConfig('same.csv', 1)], totalCount: 1 });
        processRequest.mockResolvedValueOnce({ connectionNodeConfigs: [buildItemConfig('untimed.csv', undefined)], totalCount: 1 });
        const scope = effectScope();
        const unchanged = scope.run(() => useItemChange(() => buildDataViewConfig('same.csv')));
        await settle();
        const untimed = scope.run(() => useItemChange(() => buildDataViewConfig('untimed.csv')));
        await settle();

        expect(unchanged?.itemChangeId.value).toBe('unchanged');
        expect(untimed?.itemChangeId.value).toBe('unknown');
        expect(unchanged?.itemChangeIsShown.value).toBe(false);
        expect(untimed?.itemChangeIsShown.value).toBe(false);
        scope.stop();
    });

    it('lists the folder once for both steps, and again after a check that failed', async () => {
        processRequest.mockResolvedValue({ connectionNodeConfigs: [buildItemConfig('shared.csv', 2)], totalCount: 1 });
        const scope = effectScope();
        scope.run(() => useItemChange(() => buildDataViewConfig('shared.csv')));
        await settle();
        const secondStep = scope.run(() => useItemChange(() => buildDataViewConfig('shared.csv')));
        await settle();
        expect(processRequest).toHaveBeenCalledOnce();
        expect(secondStep?.itemChangeId.value).toBe('changed');

        processRequest.mockRejectedValueOnce(new Error('Offline.'));
        const failed = scope.run(() => useItemChange(() => buildDataViewConfig('failed.csv')));
        await settle();
        expect(failed?.itemChangeId.value).toBe('unknown'); // A source that cannot be reached shows no notice.
        scope.run(() => useItemChange(() => buildDataViewConfig('failed.csv')));
        await settle();
        expect(processRequest).toHaveBeenCalledTimes(3); // Tried again, because a failed check is not kept.
        scope.stop();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A data view that read its item when the item was last changed at 1.
function buildDataViewConfig(itemName: string): DataViewConfig {
    return { connectionId: 'source1', connectionNodeConfig: buildItemConfig(itemName, 1), id: 'dataView1' } as DataViewConfig; // Only the fields the change check reads.
}

function buildItemConfig(name: string, lastModifiedAt: number | undefined): ConnectionNodeConfig {
    return { folderPath: '/data', lastModifiedAt, name, typeId: 'object' } as ConnectionNodeConfig; // Only the fields the change check reads.
}
