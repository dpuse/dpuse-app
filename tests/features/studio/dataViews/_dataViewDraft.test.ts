// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import {
    changeDataView,
    completeDataViewDraft,
    dataViewCanBeSaved,
    dataViewHasChanges,
    discardDataViewDraft,
    draftDataViewConfig
} from '@/features/studio/dataViews/_dataViewDraft';
import { forgetDraftLoad, promoteDraftLoad } from '@/features/studio/dataViews/_dataViewStore';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/features/studio/dataViews/_dataViewStore', () => ({ forgetDraftLoad: vi.fn(), promoteDraftLoad: vi.fn() }));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

const INCOMPLETE_DATA_VIEW = { connectionId: 'one', id: 'a' } as DataViewConfig;
const COMPLETE_DATA_VIEW = { ...INCOMPLETE_DATA_VIEW, connectionNodeConfig: { name: 'sales' }, sampleConfig: { parsedRecords: [] } } as unknown as DataViewConfig;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

afterEach(() => {
    draftDataViewConfig.value = undefined;
    vi.clearAllMocks();
});

describe('data view draft', () => {
    it('has no changes until one is made', () => {
        expect(dataViewHasChanges.value).toBe(false);

        changeDataView(COMPLETE_DATA_VIEW);

        expect(dataViewHasChanges.value).toBe(true);
    });

    it('can be discarded but not saved until it has an item and a preview', () => {
        changeDataView(INCOMPLETE_DATA_VIEW);
        expect(dataViewHasChanges.value).toBe(true);
        expect(dataViewCanBeSaved.value).toBe(false);

        changeDataView(COMPLETE_DATA_VIEW);
        expect(dataViewCanBeSaved.value).toBe(true);
    });

    it('clears on Discard and forgets only the load made for the draft', () => {
        changeDataView(COMPLETE_DATA_VIEW);

        discardDataViewDraft();

        expect(dataViewHasChanges.value).toBe(false);
        expect(forgetDraftLoad).toHaveBeenCalledWith('a');
        expect(promoteDraftLoad).not.toHaveBeenCalled();
    });

    it('clears after Save and makes the load the data view’s own', () => {
        changeDataView(COMPLETE_DATA_VIEW);

        completeDataViewDraft();

        expect(dataViewHasChanges.value).toBe(false);
        expect(promoteDraftLoad).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
        expect(forgetDraftLoad).not.toHaveBeenCalled();
    });
});
