// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { useBreadcrumbs } from '@/composables/useBreadcrumbs';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildTrail(): ReturnType<typeof useBreadcrumbs> {
    return useBreadcrumbs([
        { id: 'root', label: 'Root' },
        { id: 'folder', label: 'Folder' },
        { id: 'subfolder', label: 'Subfolder' }
    ]);
}

function ids(trail: ReturnType<typeof useBreadcrumbs>): string[] {
    return trail.breadcrumbs.value.map((item) => item.id);
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('useBreadcrumbs', () => {
    it('copies the starting items, so the caller’s list is never changed', () => {
        const initialItems = [{ id: 'root', label: 'Root' }];
        const trail = useBreadcrumbs(initialItems);

        trail.add({ id: 'folder', label: 'Folder' });

        expect(initialItems).toHaveLength(1);
        expect(ids(trail)).toStrictEqual(['root', 'folder']);
    });

    it('keeps the crumb the user went back to and drops everything after it', () => {
        const trail = buildTrail();

        trail.clearAfterIndex(0);

        expect(ids(trail)).toStrictEqual(['root']);
    });

    it('ignores a negative index, which names no crumb', () => {
        const trail = buildTrail();

        trail.clearAfterIndex(-1);

        expect(ids(trail)).toStrictEqual(['root', 'folder', 'subfolder']);
    });

    it('removes the last crumb', () => {
        const trail = buildTrail();

        trail.removeLast();

        expect(ids(trail)).toStrictEqual(['root', 'folder']);
    });
});
