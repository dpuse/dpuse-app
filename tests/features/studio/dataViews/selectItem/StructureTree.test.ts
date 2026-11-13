// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { StructurePath } from '@dpuse/dpuse-shared';
import type { ListObjectStructureEntriesOptions, ListStructureEntriesResult, SampleIssue, StructureEntry, StructureIndex } from '@dpuse/dpuse-shared';

// ── Local Framework
import { listItemStructureEntries } from '@/features/studio/dataViews/_dataViews';
import { raiseFailure } from '@/state/errors';
import { settle } from '~/tests/support/settle';
import StructureTree from '@/features/studio/dataViews/selectItem/StructureTree.vue';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/features/studio/dataViews/_dataViews', () => ({ listItemStructureEntries: vi.fn() }));
vi.mock('@/state/errors', () => ({ raiseFailure: vi.fn() }));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ORDERS_LOCATOR = { endOffset: 900, startOffset: 12, state: undefined };
const TOP_ENTRIES: StructureEntry[] = [
    { childCount: 2, isValueCut: false, key: 'orders', kindId: 'list', locator: ORDERS_LOCATOR, value: undefined },
    { childCount: undefined, isValueCut: false, key: 'title', kindId: 'string', locator: { endOffset: 920, startOffset: 910, state: undefined }, value: 'Sales' },
    { childCount: undefined, isValueCut: false, key: 'note', kindId: 'null', locator: { endOffset: 940, startOffset: 935, state: undefined }, value: undefined }
];
const ORDER_ENTRIES: StructureEntry[] = [
    { childCount: 3, isValueCut: false, key: 0, kindId: 'object', locator: { endOffset: 400, startOffset: 13, state: undefined }, value: undefined },
    { childCount: 3, isValueCut: false, key: 1, kindId: 'object', locator: { endOffset: 899, startOffset: 401, state: undefined }, value: undefined }
];

// The preview mapped the top of the file and its list of orders, which reads as rows.
const STRUCTURE_INDEX: StructureIndex = {
    byteCount: 1000,
    isComplete: true,
    issues: [],
    nodes: [
        {
            checkpoints: [],
            childCount: 3,
            isComplete: true,
            isTableCandidate: false,
            keys: ['orders', 'title', 'note'],
            kindId: 'object',
            locator: { endOffset: 1000, startOffset: 0, state: undefined },
            path: []
        },
        { checkpoints: [], childCount: 2, isComplete: true, isTableCandidate: true, keys: ['id'], kindId: 'list', locator: ORDERS_LOCATOR, path: ['orders'] }
    ],
    suggestedStructurePath: undefined,
    tableCandidateCount: 1
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
    // Cloned as the engine worker's 'postMessage' does, so options holding a reactive proxy fail here as they do in the app.
    vi.mocked(listItemStructureEntries).mockImplementation((_connectionId, options) => Promise.resolve(buildPage(structuredClone(options))));
});

afterEach(() => {
    for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    vi.mocked(listItemStructureEntries).mockReset();
    vi.mocked(raiseFailure).mockReset();
});

describe('StructureTree', () => {
    it('opens on the top of the file, read from its start, and lists what it holds', async () => {
        const wrapper = await mountTree({ structureIndex: undefined });

        expect(listItemStructureEntries).toHaveBeenCalledWith('connection-a', {
            dataFormatId: 'json',
            entryCount: 100,
            locator: { endOffset: undefined, startOffset: 0, state: undefined },
            maxValueLength: 200,
            parserId: 'dpuse-tool-streamparser-json-parser',
            path: '/orders.json',
            structurePath: []
        });
        expect(findRowTexts(wrapper)).toEqual(['Whole file', 'orders2 items', 'title"Sales"', 'notenull']);
        expect(findRows(wrapper)[0]?.attributes('aria-expanded')).toBe('true');
    });

    it('marks the part the preview found reads as rows, and the part read as the table', async () => {
        const wrapper = await mountTree({ currentStructurePath: ['orders'] });
        const ordersRow = findRows(wrapper)[1];

        expect(ordersRow.find('[aria-label="Reads as rows"]').exists()).toBe(true);
        expect(ordersRow.text()).toContain('Read as the table');
        expect(findRows(wrapper)[2]?.find('[aria-label="Reads as rows"]').exists()).toBe(false);
    });

    it('reads only the bytes of a part as it is opened, and closes it again', async () => {
        const wrapper = await mountTree();

        await findRows(wrapper)[1]?.trigger('click');
        await settle();

        expect(listItemStructureEntries).toHaveBeenLastCalledWith('connection-a', expect.objectContaining({ locator: ORDERS_LOCATOR, structurePath: ['orders'] }));
        expect(findRowTexts(wrapper)).toEqual(['Whole file3 keys', 'orders2 items', '03 keys', '13 keys', 'title"Sales"', 'notenull']);
        expect(findRows(wrapper)[2]?.attributes('aria-level')).toBe('3');

        await findRows(wrapper)[1]?.trigger('click');

        expect(findRowTexts(wrapper)).toEqual(['Whole file3 keys', 'orders2 items', 'title"Sales"', 'notenull']);
    });

    it('reads the next page from where the last one stopped', async () => {
        const nextLocator = { endOffset: undefined, startOffset: 935, state: undefined };
        vi.mocked(listItemStructureEntries)
            .mockResolvedValueOnce({ entries: TOP_ENTRIES.slice(0, 2), issues: [], nextLocator })
            .mockResolvedValueOnce({ entries: TOP_ENTRIES.slice(2), issues: [], nextLocator: undefined });
        const wrapper = await mountTree();

        expect(findRowTexts(wrapper).at(-1)).toBe('Show more');
        await findRows(wrapper).at(-1)?.trigger('click');
        await settle();

        expect(listItemStructureEntries).toHaveBeenLastCalledWith('connection-a', expect.objectContaining({ locator: nextLocator, structurePath: [] }));
        expect(findRowTexts(wrapper)).toEqual(['Whole file3 keys', 'orders2 items', 'title"Sales"', 'notenull']);
    });

    it('hands over the selected part to read as the table', async () => {
        const wrapper = await mountTree();
        const readButton = wrapper.get('button');

        await findRows(wrapper)[1]?.trigger('click');
        await readButton.trigger('click');

        expect(wrapper.emitted('select')).toEqual([[['orders']]]);
    });

    it('offers no table for a single value, or for the part already read as the table', async () => {
        const wrapper = await mountTree({ currentStructurePath: ['orders'] });

        await findRows(wrapper)[2]?.trigger('click');
        expect(wrapper.get('button').attributes('disabled')).toBeDefined();

        await findRows(wrapper)[1]?.trigger('click');
        expect(wrapper.get('button').attributes('disabled')).toBeDefined();
    });

    it('moves with the arrow keys, opening a part with right and closing it, then moving to its parent, with left', async () => {
        const wrapper = await mountTree();
        const tree = wrapper.get('[role="tree"]');

        await tree.trigger('keydown', { key: 'ArrowDown' });
        await settle();
        expect(document.activeElement).toBe(findRows(wrapper)[1]?.element);

        await tree.trigger('keydown', { key: 'ArrowRight' });
        await settle();
        expect(findRows(wrapper)[1]?.attributes('aria-expanded')).toBe('true');

        await tree.trigger('keydown', { key: 'ArrowRight' });
        await settle();
        expect(document.activeElement).toBe(findRows(wrapper)[2]?.element);

        await tree.trigger('keydown', { key: 'ArrowLeft' });
        await settle();
        expect(document.activeElement).toBe(findRows(wrapper)[1]?.element);

        await tree.trigger('keydown', { key: 'ArrowLeft' });
        await settle();
        expect(findRows(wrapper)[1]?.attributes('aria-expanded')).toBe('false');

        await tree.trigger('keydown', { key: 'End' });
        await settle();
        expect(document.activeElement).toBe(findRows(wrapper).at(-1)?.element);
    });

    it('reports a part that cannot be read, and reads it again when selected', async () => {
        vi.mocked(listItemStructureEntries).mockRejectedValueOnce(new Error('Network down.'));
        const wrapper = await mountTree();

        expect(raiseFailure).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to read this part of the item.' }));
        expect(findRowTexts(wrapper)).toEqual(['Whole file3 keys', 'This part could not be read. Select to try again.']);

        await findRows(wrapper)[1]?.trigger('click');
        await settle();

        expect(findRowTexts(wrapper)).toEqual(['Whole file3 keys', 'orders2 items', 'title"Sales"', 'notenull']);
    });

    it('says where a syntax error stopped the reading of a part', async () => {
        const issue: SampleIssue = {
            columnNumber: 7,
            endLineNumber: undefined,
            fieldNumber: undefined,
            id: 'JSON_INVALID',
            lineNumber: 3,
            message: "Expected ','",
            recordNumber: undefined,
            severityId: 'error',
            value: undefined
        };
        vi.mocked(listItemStructureEntries).mockResolvedValueOnce({ entries: TOP_ENTRIES.slice(0, 1), issues: [issue], nextLocator: undefined });
        const wrapper = await mountTree();

        expect(findRowTexts(wrapper)).toEqual(['Whole file3 keys', 'orders2 items', "Line 3, column 7: Expected ','"]);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function mountTree(overrides: { currentStructurePath?: StructurePath; structureIndex?: StructureIndex } = {}): Promise<VueWrapper> {
    const wrapper = mount(StructureTree, {
        attachTo: document.body, // So the arrow keys can move focus between lines.
        props: {
            connectionId: 'connection-a',
            currentStructurePath: overrides.currentStructurePath,
            dataFormatId: 'json',
            itemLabel: 'orders.json',
            itemPath: '/orders.json',
            parserId: 'dpuse-tool-streamparser-json-parser',
            structureIndex: 'structureIndex' in overrides ? overrides.structureIndex : STRUCTURE_INDEX
        }
    });
    wrappers.push(wrapper);
    await settle();
    return wrapper;
}

// The top of the file holds the orders, a title and a note, and the orders hold two objects.
function buildPage(options: ListObjectStructureEntriesOptions): ListStructureEntriesResult {
    const entries = options.structurePath.length === 0 ? TOP_ENTRIES : ORDER_ENTRIES;
    return { entries, issues: [], nextLocator: undefined };
}

function findRows(wrapper: VueWrapper): ReturnType<VueWrapper['findAll']> {
    return wrapper.findAll('[role="treeitem"]');
}

function findRowTexts(wrapper: VueWrapper): string[] {
    return findRows(wrapper).map((row) => row.text().trim());
}
