// ── External Dependencies & Registrations
import { afterEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ColumnAuditConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { ItemReading } from '@/features/studio/dataViews/_state/dataViewColumns';
import PreviewColumnTable from '@/features/studio/dataViews/_columns/PreviewColumnTable.vue';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('PreviewColumnTable', () => {
    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
    });

    it('names a column’s subtype, or its type when it has none', () => {
        const wrapper = mountTable([buildColumn({ dataSubtypeId: 'integer', dataTypeId: 'numeric' }), buildColumn({})]);

        expect(readCells(wrapper, 1)).toEqual(['Integer', 'Text']);
    });

    it('gives a derived column no row', () => {
        const wrapper = mountTable([buildColumn({ dataTypeId: 'numeric', label: { en: 'Amount' } }), buildColumn({ derivedFromColumnIndex: 0, label: { en: 'Amount unit' } })]);

        expect(wrapper.findAll('tbody tr')).toHaveLength(1);
        expect(wrapper.text()).not.toContain('Amount unit');
    });

    it('marks a key, a mandatory and a coded column once the whole item is audited', () => {
        const column = buildColumn({ hasMissingValues: false, invalidValueCount: 0, isCoded: true, validIsUnique: true });

        expect(readMarks(mountTable([column], true))).toEqual([
            'Every value is unique, none is missing and none is invalid, so this column appears to be a key',
            'Every record has a value in this column, so it appears to be mandatory',
            'A few distinct values cover many records, or every value is written to one shape, so this column appears to hold codes'
        ]);
        expect(readMarks(mountTable([column], false))).toEqual([]);
    });

    it('marks a unique column that is not a key with the fingerprint', () => {
        const column = buildColumn({ hasMissingValues: true, validIsUnique: true });

        expect(readMarks(mountTable([column], true))).toEqual(['No value repeats, leaving out missing ones, so this column appears to be unique']);
    });

    it('counts valid, invalid and missing values under the bar, a count of none included, and names each for screen readers', () => {
        const column = buildColumn({ blankValueCount: 1, emptyValueCount: 2, inferenceCounts: { string: 8 }, nullValueCount: 2 });
        const valuesCell = mountTable([column]).get('tbody td:nth-child(3)');

        expect(valuesCell.findAll('[aria-hidden="true"]').at(-1)?.text().replaceAll(/\s+/gu, ' ')).toBe('8 0 5');
        expect(valuesCell.get('.sr-only').text()).toBe('Valid: 8, Invalid: 0, Missing: 5');
    });

    it('marks an estimated distinct count with ≈, named for screen readers', () => {
        const estimated = mountTable([buildColumn({ validCountsAreEstimated: true, validDistinctValueCount: 5000 })]).get('tbody td:nth-child(4)');
        const exact = mountTable([buildColumn({ validDistinctValueCount: 12 })]).get('tbody td:nth-child(4)');

        expect(estimated.get('[role="img"]').attributes('aria-label')).toBe('Estimated');
        expect(estimated.text()).toBe('5,000');
        expect(exact.find('[role="img"]').exists()).toBe(false);
    });

    it('sets a number’s separator in extra bold and its decimal places in italics', () => {
        const column = buildColumn({ dataTypeId: 'numeric', decimalSeparatorId: ',', validMaxDecimals: 2, validMaxWholeDigits: 3, validMinDecimals: 2, validMinWholeDigits: 1 });
        const lengthCell = mountTable([column]).get('tbody td:nth-child(5)');

        expect(lengthCell.text()).toBe('1–3\u{2009},\u{2009}2');
        expect(lengthCell.get('.font-extrabold').text()).toBe(',');
        expect(lengthCell.get('.italic').text()).toBe('2');
    });

    it('names the colours of the values and format bars under their header titles', () => {
        const headers = mountTable([buildColumn({})]).findAll('th');

        expect(headers[2]?.text().replaceAll(/\s+/gu, ' ')).toBe('Values Valid Invalid Missing');
        expect(headers.at(-1)?.text().replaceAll(/\s+/gu, ' ')).toBe('Format Most common Other');
    });

    it('says under the length header what a length’s ranges are, written as a cell with decimal places is', () => {
        const lengthKey = mountTable([buildColumn({})]).get('th:nth-child(5) [aria-hidden="true"]');

        expect(lengthKey.text()).toBe('min–max\u{2009}.\u{2009}decimals');
        expect(lengthKey.get('.font-extrabold').text()).toBe('.');
        expect(lengthKey.get('.italic').text()).toBe('decimals');
    });

    it('sets lengths in figures of equal width, so ranges of the same shape line up', () => {
        expect(mountTable([buildColumn({ validMaxSize: 12, validMinSize: 3 })]).get('tbody td:nth-child(5)').classes()).toContain('tabular-nums');
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountTable(columnConfigs: ColumnAuditConfig[], isAuditComplete = false): VueWrapper {
    const itemReading: Pick<ItemReading, 'columnConfigs' | 'hasHeaders'> = { columnConfigs, hasHeaders: false };
    const wrapper = mount(PreviewColumnTable, { attachTo: document.body, props: { isAuditComplete, itemReading } });
    wrappers.push(wrapper);
    return wrapper;
}

function readCells(wrapper: VueWrapper, columnIndex: number): string[] {
    return wrapper.findAll('tbody tr').map((row) => row.findAll('td')[columnIndex]?.find('span span')?.text() ?? '');
}

function readMarks(wrapper: VueWrapper): string[] {
    return wrapper.findAll('tbody [role="img"]').map((mark) => mark.attributes('aria-label') ?? '');
}

function buildColumn(overrides: Partial<ColumnAuditConfig>): ColumnAuditConfig {
    return { dataSubtypeId: undefined, dataTypeId: 'string', inferenceCounts: {}, label: { en: 'Column' }, leadingInferenceCounts: {}, ...overrides } as ColumnAuditConfig;
}
