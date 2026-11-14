// ── External Dependencies & Registrations
import { ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';

// ── DPUse Framework
import { formatNumberAsStorageSize } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { BrowserStorageSnapshot } from '@/features/session/dataPanel/_browserStorage';
import { closeStoreForRemoval } from '@/services/storeUse';
import SessionDataPanel from '@/features/session/dataPanel/SessionDataPanel.vue';
import { clearLocalStorage, removeOpfsItem, retrieveBrowserStorageSnapshot } from '@/features/session/dataPanel/_browserStorage';
import { forgetAllLoads, forgetStoreLoads } from '@/state/dataViewLoads';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));
vi.mock('@/services/workspaceStore', () => ({ resetWorkspaceStoreQueries: vi.fn() }));
vi.mock('@/state/device', () => ({ viewportIsWide: ref(true) })); // Wide, so the overview shows beside the list.
vi.mock('@/features/session/dataPanel/_browserStorage', () => ({ clearLocalStorage: vi.fn(), removeOpfsItem: vi.fn(), retrieveBrowserStorageSnapshot: vi.fn() }));
vi.mock('@/services/storeUse', () => ({ closeStoreForRemoval: vi.fn() }));
vi.mock('@/state/dataViewLoads', () => ({ forgetAllLoads: vi.fn(), forgetStoreLoads: vi.fn() }));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MEBIBYTE = 1_048_576;

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('SessionDataPanel usage bars', () => {
    it('shows the space used against the space allowed', async () => {
        const wrapper = await mountPanel({ indexedDatabaseUsage: 60 * MEBIBYTE, quota: 1000 * MEBIBYTE, usage: 100 * MEBIBYTE });

        expect(wrapper.text()).toContain(`${formatSize(100 * MEBIBYTE)} used of ${formatSize(1000 * MEBIBYTE)} (10%)`);
    });

    it('splits the space used into IndexedDB, SQLite, DuckDB and other where the browser breaks usage down', async () => {
        const wrapper = await mountPanel({ indexedDatabaseUsage: 50 * MEBIBYTE, quota: 1000 * MEBIBYTE, usage: 100 * MEBIBYTE });

        expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe(
            `IndexedDB ${formatSize(50 * MEBIBYTE)} (50%), SQLite ${formatSize(30 * MEBIBYTE)} (30%), DuckDB ${formatSize(10 * MEBIBYTE)} (10%), and Other ${formatSize(10 * MEBIBYTE)} (10%)`
        );
    });

    it('shows IndexedDB and other as one part where the browser gives only a total', async () => {
        const wrapper = await mountPanel({ indexedDatabaseUsage: undefined, quota: 1000 * MEBIBYTE, usage: 100 * MEBIBYTE });

        expect(wrapper.find('[role="img"]').attributes('aria-label')).toBe(
            `IndexedDB and other ${formatSize(60 * MEBIBYTE)} (60%), SQLite ${formatSize(30 * MEBIBYTE)} (30%), and DuckDB ${formatSize(10 * MEBIBYTE)} (10%)`
        );
    });

    it('shows the totals for IndexedDB and OPFS beside their group labels', async () => {
        const wrapper = await mountPanel({ indexedDatabaseUsage: 50 * MEBIBYTE, quota: 1000 * MEBIBYTE, usage: 100 * MEBIBYTE });

        expect(wrapper.text()).toContain(`IndexedDB${formatSize(50 * MEBIBYTE)}`);
        expect(wrapper.text()).toContain(`File system (OPFS)${formatSize(40 * MEBIBYTE)}`);
    });

    it('leaves a part too thin to see out of the bar, but keeps it in the legend', async () => {
        const wrapper = await mountPanel({ indexedDatabaseUsage: 59 * MEBIBYTE, quota: 1000 * MEBIBYTE, usage: 99.1 * MEBIBYTE });

        expect(wrapper.findAll('[role="img"] > div').map((part) => part.attributes('title')?.split(' ', 1)[0])).toStrictEqual(['IndexedDB', 'SQLite', 'DuckDB']);
        expect(wrapper.text()).toContain(`Other ${formatSize(0.1 * MEBIBYTE)}`);
    });

    it('lists cookies, local storage and session storage first, without sizes', async () => {
        const wrapper = await mountPanel(undefined, [{ key: 'dpuse-appearance', size: 40, value: 'dark' }]);

        expect(
            wrapper
                .findAll('[data-region="ItemButton"]')
                .map((button) => button.text())
                .slice(0, 4)
        ).toStrictEqual(['Overview', 'Cookies', 'Local storage', 'Session storage']);
    });

    it('lists session storage entries with a note that they belong to this tab', async () => {
        const wrapper = await mountPanel(undefined, [], [{ key: 'dpuse-reloadedForVersion', size: 60, value: '1.0.287' }]);

        await findItemButton(wrapper, 'Session storage')?.trigger('click');

        expect(wrapper.text()).toContain('belongs to this tab only');
        expect(wrapper.find('pre').text()).toBe('1.0.287');
        expect(wrapper.text()).toContain('Clear session storage');
    });

    it('lists local storage as one item, with its entries and the clear button in the details', async () => {
        const wrapper = await mountPanel(undefined, [{ key: 'dpuse-appearance', size: 40, value: 'dark' }]);

        await findItemButton(wrapper, 'Local storage')?.trigger('click');

        expect(wrapper.text()).toContain('dpuse-appearance');
        expect(wrapper.find('pre').text()).toBe('dark');
        expect(wrapper.text()).toContain('Clear local storage');
    });

    it('draws neither bar where the browser cannot estimate its storage', async () => {
        const wrapper = await mountPanel(undefined);

        expect(wrapper.text()).not.toContain('used of');
        expect(wrapper.find('[role="img"]').exists()).toBe(false);
    });
});

describe('SessionDataPanel and loaded records', () => {
    it("closes this tab's SQLite store before deleting its databases, then forgets the records loaded into it", async () => {
        const wrapper = await mountPanel(undefined);

        await wrapper
            .findAll('[data-region="ItemButton"]')
            .find((button) => button.text().startsWith('SQLite databases')) // Its size shows beside its name.
            ?.trigger('click');
        await wrapper.findAll('button').find((button) => button.text() === 'Delete')?.trigger('click');
        await confirmDialog(wrapper, 'Delete Item?');

        expect(closeStoreForRemoval).toHaveBeenCalledWith('dpuse-connector-sqlite-wasm');
        expect(vi.mocked(closeStoreForRemoval).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(removeOpfsItem).mock.invocationCallOrder[0] ?? 0);
        expect(forgetStoreLoads).toHaveBeenCalledWith('dpuse-connector-sqlite-wasm');
    });

    it('marks the loaded tables to be dropped when local storage is cleared', async () => {
        const wrapper = await mountPanel(undefined, [{ key: 'dpuse-appearance', size: 40, value: 'dark' }]);

        await findItemButton(wrapper, 'Local storage')?.trigger('click');
        await wrapper.findAll('button').find((button) => button.text() === 'Clear local storage')?.trigger('click');
        await confirmDialog(wrapper, 'Clear Local Storage?');

        expect(clearLocalStorage).toHaveBeenCalledOnce();
        expect(forgetAllLoads).toHaveBeenCalledOnce();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Mounts the panel over a snapshot with 30 MiB of SQLite and 10 MiB of DuckDB files in OPFS, and the given estimate.
async function mountPanel(
    estimate: { indexedDatabaseUsage: number | undefined; quota: number; usage: number } | undefined,
    localStorageItems: BrowserStorageSnapshot['localStorageItems'] = [],
    sessionStorageItems: BrowserStorageSnapshot['sessionStorageItems'] = []
): Promise<ReturnType<typeof mount>> {
    const snapshot: BrowserStorageSnapshot = {
        cookies: [],
        estimate: estimate && { ...estimate, fileSystemUsage: undefined },
        indexedDatabases: [],
        localStorageItems,
        opfsItems: [
            { id: 'sqlitePool', lastModified: 1, name: '.dpuse-connector-sqlite-wasm', removalPaths: ['.dpuse-connector-sqlite-wasm'], size: 30 * MEBIBYTE, typeId: 'sqlitePool' },
            { id: 'duckdbDatabase:default', lastModified: 1, name: 'default', removalPaths: ['duckdb/fs/default.duckdb'], size: 10 * MEBIBYTE, typeId: 'duckdbDatabase' }
        ],
        sessionStorageItems
    };
    vi.mocked(retrieveBrowserStorageSnapshot).mockResolvedValue(snapshot);
    const wrapper = mount(SessionDataPanel, { global: { stubs: { ScrollArea: { template: '<div><slot /></div>' } } } });
    await flushPromises();
    return wrapper;
}

function findItemButton(wrapper: ReturnType<typeof mount>, label: string): ReturnType<ReturnType<typeof mount>['find']> | undefined {
    return wrapper.findAll('[data-region="ItemButton"]').find((button) => button.text() === label);
}

// Answers the open question with its main button.
async function confirmDialog(wrapper: ReturnType<typeof mount>, title: string): Promise<void> {
    await flushPromises();
    const dialog = wrapper.findAllComponents({ name: 'ConfirmDialog' }).find((candidate) => candidate.props('title') === title);
    dialog?.vm.$emit('confirm');
    await flushPromises();
}

function formatSize(size: number): string {
    return formatNumberAsStorageSize(size, 1, 'en');
}
