// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { readDataViewDiagramFocus } from '@/features/studio/dataViews/_state/dataViewFocus';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('readDataViewDiagramFocus', () => {
    it('reads the level from the route’s path, where a part left out names no level', () => {
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox', connectionId: 'work', dataViewId: 'a' })).toStrictEqual({ connectorId: 'dropbox', connectionId: 'work' });
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox', connectionId: '' })).toStrictEqual({ connectorId: 'dropbox', connectionId: undefined });
        expect(readDataViewDiagramFocus({ connectorId: ['dropbox', 'sqlite'] })).toStrictEqual({ connectorId: undefined, connectionId: undefined });
    });
});
