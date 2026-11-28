// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { ColumnAuditConfig, ConnectionNodeConfig, ContentAuditConfig, ToolConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import type { DataViewConnection } from '@/features/studio/dataViews/_state/dataViewSummary';
import DataViewDocument from '@/features/studio/dataViews/_components/DataViewDocument.vue';
import type { ItemReading } from '@/features/studio/dataViews/_state/dataViewColumns';
import { toolConfigs } from '@/state/configs';
import type { DataViewLoadTiming, DataViewStoreConfig } from '@/features/studio/dataViews/_state/dataViewStore';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The document links its heading to the data view's steps, which keep the page's query.
vi.mock('vue-router', () => ({ useRoute: (): object => ({ params: {}, query: { studio: '1' } }) }));

// Only the data view 'loaded' has a load, so a test chooses whether the Load section has anything to show.
vi.mock('@/features/studio/dataViews/_state/dataViewStore', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    findDataViewLoadTiming: (dataViewId: string): DataViewLoadTiming | undefined => (dataViewId === 'loaded' ? LOAD_TIMING : undefined),
    resolveDataViewStore: (): Pick<DataViewStoreConfig, 'icon' | 'iconDark' | 'label'> => ({ icon: null, iconDark: null, label: 'SQLite' })
}));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const LOAD_TIMING: DataViewLoadTiming = {
    conversionDuration: 100,
    duration: 1900,
    parseDuration: 300,
    retrieveDuration: 1000,
    sourceWaitDuration: 200,
    storeDuration: 500,
    totalDuration: 2000
};

// Stands in for the column table, which has its own tests, so a test can read how many rows it was asked for.
const PreviewColumnTableStub = defineComponent({
    props: { rowLimit: { type: Number, default: undefined } },
    setup(properties) {
        return (): ReturnType<typeof h> => h('div', { 'data-row-limit': String(properties.rowLimit) });
    }
});

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const wrappers: VueWrapper[] = [];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('DataViewDocument', () => {
    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        toolConfigs.value = [];
    });

    it('shows the heading it is given, with the caller’s introduction before the sections and its own sections after them', () => {
        const wrapper = mountDocument({
            properties: { overline: 'Data Views', title: 'Sales' },
            slots: { default: () => h('section', 'Connection section'), intro: () => h('p', 'Description') }
        });
        const text = wrapper.text();

        expect(wrapper.get('h1').text()).toBe('Sales');
        expect(text).toContain('Data Views');
        expect(text.indexOf('Description')).toBeLessThan(text.indexOf('File type'));
        expect(text.indexOf('File type')).toBeLessThan(text.indexOf('Connection section'));
    });

    it('lists every fact about the file, and says when one is not known', () => {
        const wrapper = mountDocument({ properties: { detectedReadingConfig: { encodingConfidenceLevel: undefined, encodingSourceId: 'utf8Validation' } } });
        const details = readDetails(wrapper, 'Details');

        expect(details).toEqual([
            ['Description', 'Not applicable'],
            ['File type', 'text/csv'],
            ['Size', '956 bytes'],
            ['Last modified', 'Unknown']
        ]);
        expect(readDetails(wrapper, 'Reading')[0]).toEqual(['Encoding', 'utf-8 (valid UTF-8)']); // The encoding is how the file is read, not a fact about the file.
    });

    it('says a file with no issues has none, and that an audit’s uncounted lines are unknown', () => {
        const wrapper = mountDocument({ properties: { contentAuditConfig: buildContentAuditConfig() } });

        expect(readDetails(wrapper, 'Reading')).toContainEqual(['Issues', 'None']);
        expect(readDetails(wrapper, 'Auditing')).toEqual(expect.arrayContaining([['Lines', 'Unknown'], ['Empty lines', 'Unknown'], ['Uneven records', 'Unknown']]));
    });

    it('says the encoding was chosen, or that a chosen one could not be decoded', () => {
        expect(readDetails(mountDocument({ properties: { chosenEncodingId: 'utf-8' } }), 'Reading')).toContainEqual(['Encoding', 'utf-8 (chosen)']);
        expect(readDetails(mountDocument({ properties: { chosenEncodingId: 'x-unknown' } }), 'Reading')).toContainEqual(['Encoding', "x-unknown can't be decoded, so UTF-8 is used"]);
    });

    it('lists how a file was read, in the order it is read: decoded, recognised, then parsed', () => {
        toolConfigs.value = [{ description: { en: '' }, id: 'csvParser', label: { en: 'CSV Parser' }, parser: { dataFormatIds: ['dtv'] } } as unknown as ToolConfig];
        const itemReading = buildItemReading({
            issues: [
                { endLineNumber: undefined, lineNumber: 2, message: 'a', severityId: 'error' },
                { endLineNumber: undefined, lineNumber: 3, message: 'b', severityId: 'warning' }
            ] as ItemReading['issues'],
            parserId: 'csvParser',
            replacementCharacterCount: 3
        });

        expect(readDetails(mountDocument({ properties: { itemReading } }), 'Reading')).toEqual([
            ['Encoding', 'utf-8'],
            ['Detected encodings', 'Not applicable'],
            ['Unreadable characters', '3'],
            ['Format', 'Delimited text (CSV, TSV…)'],
            ['Parser', 'CSV Parser'],
            ['Record delimiter', 'Newline (LF)'],
            ['Value delimiter', 'Comma'],
            ['Headers', 'Yes'],
            ['Issues', '2 issues']
        ]);
    });

    it('lists every encoding detected with how sure it was, and says they do not apply when none were detected', () => {
        const encodingCandidates = [
            { confidenceLevel: 0.87, id: 'utf-8' as const },
            { confidenceLevel: 0.4, id: 'windows-1252' as const },
            { confidenceLevel: undefined, id: 'iso-8859-1' as const }
        ];
        expect(readReading({ encodingCandidates })).toContainEqual(['Detected encodings', 'utf-8 (87%), windows-1252 (40%), iso-8859-1']);
        expect(readReading({ encodingCandidates: [] })).toContainEqual(['Detected encodings', 'None, as the text is all ASCII']);
        expect(readReading({})).toContainEqual(['Detected encodings', 'Not applicable']);
    });

    it('says a table’s file type does not apply, muted, and has no reading part', () => {
        const wrapper = mountDocument({ properties: { dataViewConnection: buildDataViewConnection({ itemTypeId: 'table', itemTypeLabel: 'Table' }) } });

        expect(findSectionTitles(wrapper)).toContain('Table');
        expect(readDetails(wrapper, 'Details')).toEqual([
            ['Description', 'Not applicable'],
            ['File type', 'Not applicable'],
            ['Size', '956 bytes'],
            ['Last modified', 'Unknown']
        ]);
        expect(wrapper.findAll('dd.text-muted').map((value) => value.text())).toEqual(['Not applicable', 'Not applicable']);
        expect(findPartTitles(wrapper)).not.toContain('Reading');
    });

    it('describes an item whose title says more than its name', () => {
        const connectionNodeConfig = buildConnectionNodeConfig({ extension: undefined, label: 'Gross domestic product', name: 'GDP' });

        expect(readDetails(mountDocument({ properties: { connectionNodeConfig } }), 'Details')[0]).toEqual(['Description', 'Gross domestic product']);
    });

    it('keeps the item’s heading and says what is still to choose when there is no item', () => {
        const wrapper = mountDocument({ properties: { connectionNodeConfig: undefined, itemReading: undefined } });

        expect(findSectionTitles(wrapper)).toEqual(['File']);
        expect(wrapper.text()).toContain('No file selected yet.');
    });

    it('shows the first 10 columns until the user asks for all of them', async () => {
        const columnConfigs = Array.from({ length: 12 }, (_value, index) => buildColumn(`Column ${String(index + 1)}`));
        const wrapper = mountDocument({ properties: { itemReading: buildItemReading({ columnConfigs }) } });
        const toggle = wrapper.get('button[aria-expanded]');

        expect(wrapper.get('[data-row-limit]').attributes('data-row-limit')).toBe('10');
        expect(toggle.text()).toBe('Show all 12 columns');

        await toggle.trigger('click');

        expect(wrapper.get('[data-row-limit]').attributes('data-row-limit')).toBe('undefined');
        expect(toggle.text()).toBe('Show fewer columns');
    });

    it('puts the description above the connection, folder, item and store lines', () => {
        const wrapper = mountDocument({ slots: { description: () => h('p', 'What it is for') } });
        const text = wrapper.text();

        expect(text.indexOf('What it is for')).toBeLessThan(text.indexOf('Files'));
        expect(text.indexOf('What it is for')).toBeGreaterThan(text.indexOf('Summary'));
    });

    it('ends the connection, item and store lines in links to the steps that change them, named for screen readers', () => {
        expect(readHeadingLinks(mountDocument())).toEqual([
            ['Change the connection in step 1', { name: 'connection', params: { dataViewId: 'dataView' }, query: { studio: '1' } }],
            ['Change the item in step 2', { name: 'item', params: { dataViewId: 'dataView' }, query: { studio: '1' } }],
            ['Explore the records in step 3', { name: 'data', params: { dataViewId: 'dataView' }, query: { studio: '1' } }]
        ]);
    });

    it('disables the link to the step it is shown on, and to a step that cannot be opened yet, and never hides one', () => {
        const onItemStep = mountDocument({ properties: { currentStepId: 'item' } });
        const beforeAnyItem = mountDocument({ properties: { connectionNodeConfig: undefined, itemReading: undefined } });
        const beforeAnyConnection = mountDocument({ properties: { connectionId: undefined, connectionNodeConfig: undefined, itemReading: undefined } });

        expect(readDisabledHeadingLinks(onItemStep)).toEqual(['Change the item in step 2']);
        expect(readHeadingLinks(onItemStep).map(([label]) => label)).toEqual(['Change the connection in step 1', 'Explore the records in step 3']);
        expect(readDisabledHeadingLinks(beforeAnyItem)).toEqual(['Explore the records in step 3']);
        expect(readHeadingLinks(beforeAnyItem).map(([label]) => label)).toEqual(['Change the connection in step 1', 'Choose the item in step 2']);
        expect(readDisabledHeadingLinks(beforeAnyConnection)).toEqual(['Choose the item in step 2', 'Explore the records in step 3']);
    });

    it('names the store, and says when the records are not loaded yet', () => {
        expect(readStoreLine(mountDocument())).toBe('SQLite (not loaded yet)3');
        expect(readStoreLine(mountDocument({ properties: { isLoaded: true } }))).toBe('SQLite3');
    });

    it('has no way to show more columns when every column fits', () => {
        expect(mountDocument().find('button[aria-expanded]').exists()).toBe(false);
    });

    it('leaves derived columns out of the count of columns', () => {
        const itemColumnConfigs = Array.from({ length: 10 }, (_value, index) => buildColumn(`Column ${String(index + 1)}`));
        const columnConfigs = [...itemColumnConfigs, { ...buildColumn('Column 1 unit'), derivedFromColumnIndex: 0 }];

        expect(mountDocument({ properties: { itemReading: buildItemReading({ columnConfigs }) } }).find('button[aria-expanded]').exists()).toBe(false);
    });

    it('puts the item section after the columns, with its details, reading, audit and load as parts in that order', () => {
        const wrapper = mountDocument({ properties: { contentAuditConfig: buildContentAuditConfig(), dataViewId: 'loaded' } });

        expect(findSectionTitles(wrapper)).toEqual(['Columns', 'File']);
        expect(findPartTitles(wrapper)).toEqual(['Details', 'Reading', 'Auditing', 'Loading']);
    });

    it('shows the audit and the last load once there are some', () => {
        const contentAuditConfig = buildContentAuditConfig();

        expect(findPartTitles(mountDocument())).not.toEqual(expect.arrayContaining(['Auditing', 'Loading']));
        const wrapper = mountDocument({ properties: { contentAuditConfig, dataViewId: 'loaded' } });
        expect(readDetails(wrapper, 'Auditing')).toEqual(expect.arrayContaining([['Amount', '956 bytes (100%)'], ['Records', '20']]));
        expect(readDetails(wrapper, 'Loading')[0]).toEqual(['Duration', '2.0 sec']);
    });

    it('shows a part of an audit’s time that was not timed apart as zero, and the ones that were as timed', () => {
        const firstAudit = readDetails(mountDocument({ properties: { contentAuditConfig: buildContentAuditConfig() } }), 'Auditing');
        const timedAudit = readDetails(mountDocument({ properties: { contentAuditConfig: { ...buildContentAuditConfig(), sourceWaitDuration: 30 } } }), 'Auditing');

        expect(firstAudit).toContainEqual(['Waiting for data', '0 sec']);
        expect(timedAudit).toContainEqual(['Waiting for data', '0.03 sec']);
    });

    it('lists an audit’s lines, then the header row, records and empty lines they are made of', () => {
        const contentAuditConfig = { ...buildContentAuditConfig(), commentLineCount: 0, emptyLineCount: 1, invalidFieldLengthCount: 0, lineCount: 22 };
        const withHeader = readDetails(mountDocument({ properties: { contentAuditConfig } }), 'Auditing');
        const withoutHeader = readDetails(mountDocument({ properties: { contentAuditConfig, itemReading: buildItemReading({ hasHeaders: false }) } }), 'Auditing');

        expect(withHeader.slice(1, 6)).toEqual([
            ['Lines', '22'],
            ['Header rows', '1'],
            ['Records', '20'],
            ['Empty lines', '1'],
            ['Comment lines', '0']
        ]);
        expect(withoutHeader).toContainEqual(['Header rows', '0']);
    });

    it('says the header row count does not apply to a format that has no header row', () => {
        const itemReading = buildItemReading({ dataFormatId: 'json' });
        const details = readDetails(mountDocument({ properties: { contentAuditConfig: buildContentAuditConfig(), itemReading } }), 'Auditing');

        expect(details).toContainEqual(['Header rows', 'Not applicable']);
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountDocument({
    properties = {},
    slots = {}
}: { properties?: Partial<InstanceType<typeof DataViewDocument>['$props']>; slots?: Record<string, () => ReturnType<typeof h>> } = {}): VueWrapper {
    const wrapper = mount(DataViewDocument, {
        global: { stubs: { PreviewColumnTable: PreviewColumnTableStub, RouterLink: RouterLinkStub } },
        props: {
            connectionId: 'connection',
            connectionNodeConfig: buildConnectionNodeConfig({}),
            dataViewConnection: buildDataViewConnection({}),
            dataViewId: 'dataView',
            itemReading: buildItemReading({}),
            title: 'Summary',
            ...properties
        },
        slots
    });
    wrappers.push(wrapper);
    return wrapper;
}

// The names screen readers hear for the disabled links in the heading's lines.
function readDisabledHeadingLinks(wrapper: VueWrapper): (string | undefined)[] {
    return wrapper
        .getComponent({ name: 'DataViewSource' })
        .findAll('[aria-disabled="true"]')
        .map((link) => link.attributes('aria-label'));
}

// Each link in the heading's lines, as the name screen readers hear and where it goes.
function readHeadingLinks(wrapper: VueWrapper): [string, unknown][] {
    return wrapper
        .getComponent({ name: 'DataViewSource' })
        .findAllComponents(RouterLinkStub)
        .map((link) => [link.attributes('aria-label') ?? '', link.props('to')]);
}

// The rows of the Reading part of a document mounted with the given properties.
function readReading(properties: object): string[][] {
    return readDetails(mountDocument({ properties }), 'Reading');
}

// The heading's last line, which names the store.
function readStoreLine(wrapper: VueWrapper): string {
    return wrapper.getComponent({ name: 'DataViewSource' }).findAll(':scope > div').at(-1)?.text() ?? '';
}

function findSectionTitles(wrapper: VueWrapper): string[] {
    return wrapper.findAll('h2').map((heading) => heading.text());
}

// Each row of the named part's list, as its label and value.
function readDetails(wrapper: VueWrapper, partTitle: string): string[][] {
    const part = wrapper.findAll('h3').find((heading) => heading.text() === partTitle)?.element.parentElement;
    if (!part) throw new Error(`No '${partTitle}' part.`);
    const labels = [...part.querySelectorAll('dt')].map((term) => term.textContent.trim());
    const values = [...part.querySelectorAll('dd')].map((definition) => definition.textContent.trim());
    return labels.map((label, index) => [label, values[index] ?? '']);
}

// The headings of the item section's parts, such as its details and its parse.
function findPartTitles(wrapper: VueWrapper): string[] {
    return wrapper.findAll('h3').map((heading) => heading.text());
}

function buildConnectionNodeConfig(overrides: Partial<ConnectionNodeConfig>): ConnectionNodeConfig {
    return {
        childCount: undefined,
        description: '',
        extension: 'csv',
        folderPath: '/Samples',
        icon: null,
        iconDark: null,
        id: '/Samples/people.csv',
        label: 'people.csv',
        lastModifiedAt: undefined,
        mimeType: 'text/csv',
        name: 'people',
        size: 956,
        typeId: 'object',
        ...overrides
    };
}

function buildDataViewConnection(overrides: Partial<DataViewConnection>): DataViewConnection {
    return {
        categoryLabel: 'File Store',
        connectorId: 'fileStore',
        connectorLabel: 'File Store',
        itemTypeId: 'file',
        itemTypeLabel: 'File',
        label: 'Files',
        status: undefined,
        version: '1.0.0',
        ...overrides
    };
}

function buildItemReading(overrides: Partial<ItemReading>): ItemReading {
    return {
        columnConfigs: [buildColumn('id')],
        dataFormatId: 'dtv',
        encodingConfidenceLevel: undefined,
        encodingId: 'utf-8',
        fileType: undefined,
        hasHeaders: true,
        issues: [],
        parsedRecords: [],
        parserId: undefined,
        recordDelimiterId: '\n',
        size: 956,
        text: undefined,
        valueDelimiterId: ',',
        ...overrides
    };
}

function buildColumn(label: string): ColumnAuditConfig {
    return { dataSubtypeId: undefined, dataTypeId: 'string', label: { en: label } } as ColumnAuditConfig;
}

function buildContentAuditConfig(): ContentAuditConfig {
    return {
        asAt: Date.UTC(2026, 10, 27),
        byteCount: 956,
        columns: [],
        commentLineCount: undefined,
        duration: 300,
        emptyLineCount: undefined,
        invalidFieldLengthCount: undefined,
        isComplete: true,
        lineCount: undefined,
        recordCount: 20,
        sourceWaitDuration: undefined
    };
}
