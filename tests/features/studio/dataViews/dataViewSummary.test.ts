// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ConnectionNodeConfig, ContentAuditConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructDataViewSteps, constructItemPath, resolveCurrentDataViewStepId } from '@/features/studio/dataViews/dataViewSummary';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildNode(extension: string | undefined): ConnectionNodeConfig {
    return { folderPath: '/reports', name: 'sales', extension } as ConnectionNodeConfig;
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructItemPath', () => {
    it('joins the folder, name and extension into the path the engine takes', () => {
        expect(constructItemPath(buildNode('csv'))).toBe('/reports/sales.csv');
    });

    it('adds no trailing dot for an item without an extension', () => {
        expect(constructItemPath(buildNode(undefined))).toBe('/reports/sales');
    });
});

describe('constructDataViewSteps', () => {
    it('marks each step done once its part of the data view is set', () => {
        const steps = constructDataViewSteps({ connectionId: 'c1', connectionNodeConfig: buildNode('csv'), contentAuditConfig: undefined });

        expect(steps).toStrictEqual([
            { id: 'connection', state: 'done' },
            { id: 'item', state: 'done' },
            { id: 'content', state: 'pending' }
        ]);
    });
});

describe('resolveCurrentDataViewStepId', () => {
    it('opens a new data view on its first step', () => {
        expect(resolveCurrentDataViewStepId({ connectionId: undefined, connectionNodeConfig: undefined, contentAuditConfig: undefined })).toBe('connection');
    });

    it('opens on the first step still pending', () => {
        expect(resolveCurrentDataViewStepId({ connectionId: 'c1', connectionNodeConfig: undefined, contentAuditConfig: undefined })).toBe('item');
    });

    it('opens on exploring once every step is done, since exploring is never finished', () => {
        const dataView = { connectionId: 'c1', connectionNodeConfig: buildNode('csv'), contentAuditConfig: {} as ContentAuditConfig };

        expect(resolveCurrentDataViewStepId(dataView)).toBe('data');
    });
});
