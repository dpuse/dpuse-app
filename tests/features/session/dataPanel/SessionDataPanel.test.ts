// ── External Dependencies & Registrations
import { ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

// ── DPUse Framework
import { formatNumberAsStorageSize } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { BrowserStorageSnapshot } from '@/features/session/dataPanel/_browserStorage';
import { retrieveBrowserStorageSnapshot } from '@/features/session/dataPanel/_browserStorage';
import SessionDataPanel from '@/features/session/dataPanel/SessionDataPanel.vue';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));
vi.mock('@/services/workspaceStore', () => ({ resetWorkspaceStoreQueries: vi.fn() }));
vi.mock('@/state/device', () => ({ viewportIsWide: ref(true) })); // Wide, so the overview shows beside the list.
vi.mock('@/features/session/dataPanel/_browserStorage', () => ({ retrieveBrowserStorageSnapshot: vi.fn() }));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MEBIBYTE = 1_048_576;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('SessionDataPanel usage bars', () => {
    it('shows the space used against the space allowed', async () => {
        const wrapper = await mountPanel({ indexedDatabaseUsage: 60 * MEBIBYTE, quota: 1000 * MEBIBYTE, usage: 100 * MEBIBYTE });

        expect(wrapper.text()).toContain(`${formatSize(100 * MEBIBYTE)} used of ${formatSize(1000 * MEBIBYTE)} (10%)`);
    });

    it('splits the space used into IndexedDB, OPFS and other where the browser breaks usage down', async () => {
        const wrapper = await mountPanel({ indexedDatabaseUsage: 60 * MEBIBYTE, quota: 1000 * MEBIBYTE, usage: 100 * MEBIBYTE });

        expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe(
            `IndexedDB ${formatSize(60 * MEBIBYTE)} (60%), File system (OPFS) ${formatSize(30 * MEBIBYTE)} (30%), and Other ${formatSize(10 * MEBIBYTE)} (10%)`
        );
    });

    it('shows IndexedDB and other as one part where the browser gives only a total', async () => {
        const wrapper = await mountPanel({ indexedDatabaseUsage: undefined, quota: 1000 * MEBIBYTE, usage: 100 * MEBIBYTE });

        expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe(
            `IndexedDB and other ${formatSize(70 * MEBIBYTE)} (70%) and File system (OPFS) ${formatSize(30 * MEBIBYTE)} (30%)`
        );
    });

    it('draws neither bar where the browser cannot estimate its storage', async () => {
        const wrapper = await mountPanel(undefined);

        expect(wrapper.text()).not.toContain('used of');
        expect(wrapper.find('[role="img"]').exists()).toBe(false);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Mounts the panel over a snapshot with 30 MiB of OPFS files and the given estimate.
async function mountPanel(estimate: { indexedDatabaseUsage: number | undefined; quota: number; usage: number } | undefined): Promise<ReturnType<typeof mount>> {
    const snapshot: BrowserStorageSnapshot = {
        estimate: estimate && { ...estimate, fileSystemUsage: undefined },
        indexedDatabases: [],
        localStorageItems: [],
        opfsItems: [{ id: 'sqlitePool', lastModified: 1, name: '.dpuse-connector-sqlite-wasm', removalPaths: ['.dpuse-connector-sqlite-wasm'], size: 30 * MEBIBYTE, typeId: 'sqlitePool' }]
    };
    vi.mocked(retrieveBrowserStorageSnapshot).mockResolvedValue(snapshot);
    const wrapper = mount(SessionDataPanel, { global: { stubs: { ScrollArea: { template: '<div><slot /></div>' } } } });
    await flushPromises();
    return wrapper;
}

function formatSize(size: number): string {
    return formatNumberAsStorageSize(size, 1, 'en');
}
