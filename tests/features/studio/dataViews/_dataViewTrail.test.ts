// ── External Dependencies & Registrations
import { describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import type { ConnectionNodeConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructDataViewTrail } from '@/features/studio/dataViews/_dataViewTrail';
import type { ItemStepTrail } from '@/features/studio/dataViews/_itemStepTrail';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const LABELS = { home: 'Home', trail: 'Trail' };
const WORK = { icon: '<svg data-id="work"/>', iconDark: null, label: 'Work' };
const PEOPLE = { folderPath: '/HR/2024', label: 'people.csv', name: 'people.csv' } as ConnectionNodeConfig;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructDataViewTrail', () => {
    it('starts with the connection, then the folders down to the item, then the item, all as text', () => {
        const trail = constructDataViewTrail(WORK, PEOPLE, undefined, LABELS);

        expect(trail.items.map((item) => item.label)).toStrictEqual(['Work', 'HR', '2024', 'people.csv']);
        expect(trail.items.every((item) => item.select == null && item.to == null)).toBe(true);
        expect(trail.items[0]).toMatchObject({ configIcon: { icon: WORK.icon }, isLabelHidden: true });
        expect(trail.tooltip).toBeDefined();
    });

    it('names a connection with nothing after it, because its icon alone would not say which one it is', () => {
        const trail = constructDataViewTrail(WORK, undefined, undefined, LABELS);

        expect(trail.items).toHaveLength(1);
        expect(trail.items[0]).toMatchObject({ label: 'Work', isLabelHidden: false });
    });

    it('holds a place for the connection before one is chosen', () => {
        const trail = constructDataViewTrail(undefined, undefined, undefined, LABELS);

        expect(trail.items).toHaveLength(1);
        expect(trail.items[0]).toMatchObject({ label: 'Home', isLabelHidden: true });
        expect(trail.items[0]?.icon).toBeDefined();
    });

    it('on the item task, shows the open folder and chosen item, with every folder above the open one as a link', () => {
        const itemStepTrail = buildItemStepTrail({ folderNodeConfigs: [{ label: 'HR' }, { label: '2024' }] as ConnectionNodeConfig[], itemConfig: PEOPLE });
        const trail = constructDataViewTrail(WORK, undefined, itemStepTrail, LABELS);

        expect(trail.items.map((item) => item.select != null)).toStrictEqual([true, true, false, true]); // The open folder '2024' is text.
        trail.items[1]?.select?.();
        trail.items[3]?.select?.();
        expect(itemStepTrail.selectFolder).toHaveBeenCalledWith(1);
        expect(itemStepTrail.revealItem).toHaveBeenCalledOnce();
    });

    it('gives way to one button back while a narrow screen shows the item’s preview', () => {
        const itemStepTrail = buildItemStepTrail({ backLabel: 'Files', itemConfig: PEOPLE });
        const trail = constructDataViewTrail(WORK, undefined, itemStepTrail, LABELS);

        expect(trail.back?.label).toBe('Files');
        trail.back?.select();
        expect(itemStepTrail.returnToList).toHaveBeenCalledOnce();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildItemStepTrail(overrides: Partial<ItemStepTrail>): ItemStepTrail {
    return { backLabel: undefined, folderNodeConfigs: [], itemConfig: undefined, returnToList: vi.fn(), revealItem: vi.fn(), selectFolder: vi.fn(), ...overrides };
}
