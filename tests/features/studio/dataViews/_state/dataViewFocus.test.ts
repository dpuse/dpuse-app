// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { constructDataViewDiagramFocusQuery, readDataViewDiagramFocus } from '@/features/studio/dataViews/_state/dataViewFocus';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('readDataViewDiagramFocus', () => {
    it('reads the level from the route’s path, where a part left out names no level', () => {
        const noFolder = { folderPath: undefined };
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox', connectionId: 'work', dataViewId: 'a' })).toStrictEqual({ connectorId: 'dropbox', connectionId: 'work', ...noFolder });
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox', connectionId: '' })).toStrictEqual({ connectorId: 'dropbox', connectionId: undefined, ...noFolder });
        expect(readDataViewDiagramFocus({ connectorId: ['dropbox', 'sqlite'] })).toStrictEqual({ connectorId: undefined, connectionId: undefined, ...noFolder });
    });

    it('reads the folder from the query, the empty top folder included, only with a connection', () => {
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox', connectionId: 'work' }, { folder: '/hr' })).toMatchObject({ folderPath: '/hr' });
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox', connectionId: 'work' }, { folder: '' })).toMatchObject({ folderPath: '' });
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox' }, { folder: '/hr' })).toMatchObject({ folderPath: undefined });
        expect(readDataViewDiagramFocus({ connectorId: 'dropbox', connectionId: 'work' }, { folder: ['/hr', '/x'] })).toMatchObject({ folderPath: undefined });
    });
});

describe('constructDataViewDiagramFocusQuery', () => {
    it('sets the folder, or removes it, and keeps the rest of the query', () => {
        expect(constructDataViewDiagramFocusQuery({ folder: '/hr', tab: 'a' }, '/finance')).toStrictEqual({ folder: '/finance', tab: 'a' });
        expect(constructDataViewDiagramFocusQuery({ folder: '/hr', tab: 'a' }, undefined)).toStrictEqual({ tab: 'a' });
    });
});
