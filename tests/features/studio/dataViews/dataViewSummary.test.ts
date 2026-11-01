// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared';

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
        const steps = constructDataViewSteps({ connectionNodeConfig: buildNode('csv') });

        expect(steps).toStrictEqual([
            { id: 'connection', state: 'done' },
            { id: 'item', state: 'done' }
        ]);
    });
});

describe('resolveCurrentDataViewStepId', () => {
    it('opens on the connection when no item is saved', () => {
        expect(resolveCurrentDataViewStepId({ connectionNodeConfig: undefined })).toBe('connection');
    });

    it('opens on exploring once an item is saved, because an audit is optional', () => {
        const dataView = { connectionNodeConfig: buildNode('csv') };

        expect(resolveCurrentDataViewStepId(dataView)).toBe('data');
    });
});
