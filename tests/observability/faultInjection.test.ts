// ── External Dependencies & Registrations
import { afterEach, describe, expect, it } from 'vitest';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { isStaleDeployError } from '@/state/errors';
import { hasFault, throwOnFault, throwOnStaleFault } from '@/observability/faultInjection';

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function requestFault(fault: string): void {
    history.replaceState({}, '', `/?fault=${fault}`);
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('hasFault', () => {
    afterEach(() => {
        history.replaceState({}, '', '/');
    });

    it('is false when the URL asks for no fault', () => {
        expect(hasFault('engine')).toBe(false);
    });

    it('matches any of several faults listed together, so a modifier can go with the fault it modifies', () => {
        requestFault('engine,report-failure');

        expect(hasFault('engine')).toBe(true);
        expect(hasFault('report-failure')).toBe(true);
        expect(hasFault('auth')).toBe(false);
    });

    it('applies a fault with no target to every call site', () => {
        requestFault('panel');

        expect(hasFault('panel', 'ChatPanel')).toBe(true);
        expect(hasFault('panel', 'LibraryPanel')).toBe(true);
    });

    it('applies a fault with a target only to that call site, so a nested panel can be reached', () => {
        requestFault('panel:ChatPanel');

        expect(hasFault('panel', 'ChatPanel')).toBe(true);
        expect(hasFault('panel', 'LibraryPanel')).toBe(false);
        expect(hasFault('panel')).toBe(false);
    });
});

describe('throwOnFault', () => {
    afterEach(() => {
        history.replaceState({}, '', '/');
    });

    it('does nothing unless its fault is requested', () => {
        expect(() => {
            throwOnFault('engine');
        }).not.toThrow();
    });

    it('throws a simulated failure that names its fault', () => {
        requestFault('engine');

        expect(() => {
            throwOnFault('engine');
        }).toThrow(AppError);
        expect(() => {
            throwOnFault('engine');
        }).toThrow("Simulated 'engine' failure.");
    });
});

describe('throwOnStaleFault', () => {
    afterEach(() => {
        history.replaceState({}, '', '/');
    });

    it('throws an error the app recognises as a stale deployment', () => {
        requestFault('route-stale');

        let thrown: unknown;
        try {
            throwOnStaleFault('route-stale');
        } catch (error) {
            thrown = error;
        }

        expect(isStaleDeployError(thrown)).toBe(true);
    });
});
