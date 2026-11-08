<script setup lang="ts">
// ── Template Notes ─ TODO: Revisit later. These belong beside their elements in the template, but a comment at the
// template's root breaks the fade between route views in development: Vue never reports the old view as gone, so the
// next one never appears. Production builds strip comments, so only development is affected.
// - List error notice: covers the region, because without the list there is nothing to choose from. An item's error
//   covers only the detail, so the list stays usable.

// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';
import {
    ArrowRightIcon,
    AsteriskIcon,
    BracesIcon,
    CheckIcon,
    ChevronDownIcon,
    CircleAlertIcon,
    CircleOffIcon,
    CircleStopIcon,
    DatabaseIcon,
    FileIcon,
    FolderIcon,
    InfoIcon,
    KeyRoundIcon,
    LanguagesIcon,
    RotateCwIcon,
    ScanTextIcon,
    SeparatorVerticalIcon,
    SheetIcon,
    SlidersHorizontalIcon,
    TextIcon,
    TriangleAlertIcon
} from '@lucide/vue';
import { type Component, computed, type CSSProperties, markRaw, nextTick, ref, shallowRef, useId, useTemplateRef, watch } from 'vue';
import { until, useElementSize } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import {
    AppError,
    DATA_FORMAT_CONFIGS,
    formatNumberAsDecimalNumber,
    formatNumberAsStorageSize,
    getEncodingTypeConfigs,
    listParserToolConfigs,
    localiseConfigs,
    VALUE_DELIMITER_CONFIGS
} from '@dpuse/dpuse-shared';
import type {
    AuditObjectContentResult,
    ClassifyPreviewValuesOptions,
    ConnectionConfig,
    ConnectionNodeConfig,
    ContentAuditConfig,
    DataFormatId,
    DataViewConfig,
    DecimalSeparatorId,
    GetInfoOptions,
    GetInfoResult,
    ListNodesOptions,
    ListNodesResult,
    LocalisedConfig,
    ObjectColumnConfig,
    PreviewObjectOptions,
    PreviewObjectResult,
    PreviewValueStateId,
    ReadingConfig,
    RecountPreviewColumnsOptions,
    SampleIssue,
    SampleIssueSeverityId,
    ToolConfig,
    ValueDelimiterId
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { applyPreviewHeaders } from './_previewHeaders';
import { assertDefined } from '@/utilities/index.ts';
import type { AuditChoice } from './AuditMenu.vue';
import AuditMenu from './AuditMenu.vue';
import { changeDataView } from '@/features/studio/dataViews/_dataViewDraft';
import ColumnValueBar from './ColumnValueBar.vue';
import type { DataSource } from '@/composables/useDataWindow';
import { establishEngineWorker } from '@/services/engine';
import { getColumnTypeIcon } from '../_columnTypeIcons';
import { ignoreReportedNavigationFailure } from '@/router';
import { renderMarkdown } from '@/services/useMarkedTool';
import { TEXT } from './SelectItemPanel_.json';
import { useItemAudit } from './useItemAudit';
import { useItemStepTrail } from '../_itemStepTrail';
import { type AppFailure, raiseFailure } from '@/state/errors';
import {
    applyPreviewColumnType,
    applyPreviewColumnTypes,
    applyPreviewDecimalSeparator,
    applyPreviewDecimalSeparators,
    applyPreviewNullWordChoice,
    applyPreviewNullWordChoices,
    CHOOSABLE_COLUMN_TYPES,
    constructColumnEnding,
    constructDecimalPadding,
    type DetectedColumnType
} from './_previewColumnTypes';
import {
    type ChosenColumnTypes,
    type ChosenDecimalSeparators,
    type ChosenNullWords,
    constructChosenColumnTypes,
    constructChosenDecimalSeparators,
    constructChosenNullWords,
    constructColumnChoiceConfigs,
    constructColumnTypeId,
    constructDataTypeCellClass,
    constructItemReading,
    constructPreviewContentAuditConfig,
    constructReadingConfig,
    constructSampleConfig,
    isDerivedColumn,
    type ItemReading
} from '../_dataViewColumns';
import {
    constructColumnTypeLabel,
    constructColumnValueCounts,
    constructDataTypeLabel,
    constructPreviewColumnRows,
    countChosenTypeMisfits
} from '../_previewColumnRows';
import { constructDataFormatLabel, constructRecordDelimiterLabel, constructValueDelimiterLabel } from '../_readingLabels';
import { constructDataViewConnection, constructItemPath } from '../dataViewSummary';
import { constructFittedColumnWidth, HEADER_TAB_INSET_PX } from '@/components/ui/table/tableColumnWidth';
import { DATA_FORMAT_ICON_CONFIGS, type DataFormatIconConfig } from '../_dataFormatIcons';
import { DATA_VIEW_SCROLL_ACTIONS_ID, DATA_VIEW_STEP_ACTION_ID, useCurrentDataView } from '@/features/studio/dataViews/_dataViews';
import { findConnectionLocalisedConfig, toolConfigs } from '@/state/configs';
import { listDataViewStoreConnections, resolveStoreConnectorId } from '../_dataViewStore';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import BusyBar from '@/components/ui/BusyBar.vue';
import ColumnDetailPanel from '@/features/studio/dataViews/ColumnDetailPanel.vue';
import ColumnSearch from '@/features/studio/dataViews/ColumnSearch.vue';
import type { ColumnSearchOption } from '@/features/studio/dataViews/ColumnSearch.vue';
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
import DataViewSource from '../DataViewSource.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import HeadersIcon from './HeadersIcon.vue';
import { Menu } from '@/components/ui/menu';
import PillSegment from '@/components/ui/action/PillSegment.vue';
import PreviewColumnTable from '../PreviewColumnTable.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import ScrollEndButtons from '@/components/ui/scroll/ScrollEndButtons.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import type { SelectOption } from '@/components/ui/SelectInput.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';
import ValueDelimiterIcon from './ValueDelimiterIcon.vue';
import TextViewer, { type LineHighlightId } from '@/components/ui/text/TextViewer.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface PreviewTab {
    icon: Component;
    id: PreviewTabId;
    labelKey: keyof typeof TEXT;
}

type PreviewTabId = 'table' | 'text' | 'details';

interface FormatSupport {
    ariaKey: keyof typeof TEXT;
    colorClass: string;
    icon?: Component; // Shown when the format has no icon of its own in the toolbar.
    id: FormatSupportId;
}

type FormatSupportId = 'supported' | 'planned' | 'unsupported';

interface PreviewToolbarStage {
    auditStatusIsShort: boolean;
    previewTabsAreFolded: boolean;
    readChoicesAreFolded: boolean;
    readChoiceValuesAreHidden: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Preview Tabs ─ Ways to show the item. Only delimited text has a table of records and of columns to show.
const PREVIEW_TABS: PreviewTab[] = [
    { icon: markRaw(SheetIcon), id: 'table', labelKey: 'tab.table.label' },
    { icon: markRaw(TextIcon), id: 'text', labelKey: 'tab.text.label' },
    { icon: markRaw(InfoIcon), id: 'details', labelKey: 'tab.details.label' }
];

// ── Data Formats ─ The formats the app can read today. Only delimited text is data. Markdown is a document, so it is
// not parsed and its table tab is disabled. JSON, JSON Lines and the other planned formats wait for their own reader, so
// they show as text and cannot be selected.
const TEXT_DATA_FORMAT_IDS = new Set<DataFormatId>(DATA_FORMAT_CONFIGS.filter(({ isText }) => isText).map(({ id }) => id));
const TABLE_DATA_FORMAT_IDS = new Set<DataFormatId>(DATA_FORMAT_CONFIGS.filter(({ isTable }) => isTable).map(({ id }) => id));
const READABLE_DATA_FORMAT_IDS = new Set<DataFormatId>(DATA_FORMAT_CONFIGS.filter(({ supportId }) => supportId === 'supported').map(({ id }) => id)); // Marked as supported in the toolbar, and the formats the user can choose to read an item as data.
const PLANNED_DATA_FORMAT_IDS = new Set<DataFormatId>(DATA_FORMAT_CONFIGS.filter(({ supportId }) => supportId === 'planned').map(({ id }) => id)); // Data the app means to read once each has a reader.

// ── Format Supports ─ How the toolbar marks the format: readable, planned but with no reader yet, or not data at all.
const FORMAT_SUPPORTS: FormatSupport[] = [
    { ariaKey: 'format.supported.aria', colorClass: 'text-success-text', icon: markRaw(CheckIcon), id: 'supported' },
    { ariaKey: 'format.planned.aria', colorClass: 'text-warning-text', id: 'planned' },
    { ariaKey: 'format.unsupported.aria', colorClass: 'text-danger-text', icon: markRaw(CircleOffIcon), id: 'unsupported' }
];

// ── Preview Issues ─ The app's own wording for the issues it knows, by the parser's code. Any other issue shows the
// parser's message, which is in English. Each severity has its own icon and colour, as status tags do.
const COLUMN_TYPES_RESET_ISSUE_ID = 'columnTypesReset'; // The app's own issue, because a new reading can change the columns the user's choices were for.
const SAMPLE_ISSUE_TEXT_KEYS: Partial<Record<string, keyof typeof TEXT>> = {
    CSV_INVALID_CLOSING_QUOTE: 'issue.invalidClosingQuote.text',
    CSV_NON_TRIMABLE_CHAR_AFTER_CLOSING_QUOTE: 'issue.charAfterClosingQuote.text',
    CSV_QUOTE_NOT_CLOSED: 'issue.quoteNotClosed.text',
    [COLUMN_TYPES_RESET_ISSUE_ID]: 'issue.columnTypesReset.text',
    empty: 'issue.empty.text',
    INVALID_OPENING_QUOTE: 'issue.invalidOpeningQuote.text'
};
const SAMPLE_ISSUE_SEVERITIES: Record<SampleIssueSeverityId, { bandClass: string; colorClass: string; icon: Component; lineHighlightId: LineHighlightId }> = {
    error: { bandClass: 'bg-danger', colorClass: 'text-danger-text', icon: markRaw(CircleAlertIcon), lineHighlightId: 'danger' },
    info: { bandClass: 'bg-info', colorClass: 'text-info-text', icon: markRaw(InfoIcon), lineHighlightId: 'info' },
    warning: { bandClass: 'bg-warning', colorClass: 'text-warning-text', icon: markRaw(TriangleAlertIcon), lineHighlightId: 'warning' }
};
const SAMPLE_ISSUE_SEVERITY_IDS: SampleIssueSeverityId[] = ['error', 'warning', 'info']; // Most serious first.

const AUTO_OPTION_ID = 'auto'; // The selects' value for 'read it as detected'. No format, encoding or value delimiter has this id.
const HEADERS_OPTION_IDS = { no: 'no', yes: 'yes' }; // The headers select's other values.
const CONTAINER_FILE_TYPE_EXTENSIONS = new Set(['cfb']); // Detected types that only name a container, e.g. a legacy Excel or Word file, so the item's own extension names it better.

// useDataWindow's retry-with-backoff (~900ms total) is tuned for transient blips, not a cold app boot — on a fresh
// deploy in particular, downloading new bundles, waking configMonitor/accountMonitor's Durable Objects, and then
// resolving the active connection via the data view's own engine round-trip can easily take longer than that. So instead of a short fixed retry, wait directly on the value itself.
// Deciding whether the connection has genuinely disappeared (vs. just not resolved yet) is DataViewsLayout's
// job, not this function's — it redirects away (unmounting this component) once that's confirmed, so this only
// needs a generous timeout as a last-resort bail-out for the case where neither ever happens.
const ACTIVE_CONNECTION_CONFIG_WAIT_TIMEOUT_MS = 20_000;
// The preview grows with the audit up to this size, because it is held in memory and saved with the data view. Anything
// beyond it is only audited.
const PREVIEW_BYTE_LIMIT = 65_536;
const AUDIT_BYTE_LIMITS = [PREVIEW_BYTE_LIMIT, 1_048_576, 10_485_760, 104_857_600];
const AUDIT_CHOICE_LIMIT = 2; // The next sizes offered, as well as all of the item, because the toolbar has little room.
const MINIMUM_FITTED_PREVIEW_COLUMN_WIDTH_PX = 72; // A column of short values with a short label stays wide enough to click its type icon and name.
const MINIMUM_PREVIEW_COLUMN_WIDTH_PX = 72; // Keeps the header's type icon and the start of its name in view.
const PREVIEW_COLUMN_MARKS_WIDTH_PX = 60; // The type icon before a name, 22px, the mandatory and key marks after it, 34px, and 4px so a measured name is never a pixel short.
const PREVIEW_INVALID_ICON_WIDTH_PX = 20; // The icon beside an invalid value: 14px and the cell's 'gap-x-1.5'.
const PREVIEW_SCROLL_PADDING_BOTTOM = 'calc(var(--vertical-scroll-bottom-screen-inset) - var(--status-bar-height))'; // The usual room after the last row, less the status bar's height, because the preview already ends above it.

// ── Toolbar Stages ─ The toolbar is one row, so as it runs short of room it gives some up, a step at a time. First
// the selects' values truncate, down to a few letters. Then the values go, leaving the icons, the audit status
// shortens, the tabs fold into a menu, and last the read choices fold into one button. The first stage that fits is
// shown, measured rather than set by width, because what fits depends on the values and the language.
const PREVIEW_TOOLBAR_STAGES: PreviewToolbarStage[] = [
    { auditStatusIsShort: false, previewTabsAreFolded: false, readChoicesAreFolded: false, readChoiceValuesAreHidden: false },
    { auditStatusIsShort: false, previewTabsAreFolded: false, readChoicesAreFolded: false, readChoiceValuesAreHidden: true },
    { auditStatusIsShort: true, previewTabsAreFolded: false, readChoicesAreFolded: false, readChoiceValuesAreHidden: true },
    { auditStatusIsShort: true, previewTabsAreFolded: true, readChoicesAreFolded: false, readChoiceValuesAreHidden: true },
    { auditStatusIsShort: true, previewTabsAreFolded: true, readChoicesAreFolded: true, readChoiceValuesAreHidden: false } // The folded choices have room to show their values.
];
const READ_CHOICES_GAP_PX = 4; // Between the toolbar and the folded read choices below it.
const VIEWPORT_MARGIN_PX = 8; // Keeps the folded read choices clear of the window's edges.

// ── Value Tints ─ Each a layer inset from the cell's edges, so neighbouring marked values stay apart and nothing in the cell
// moves. Red is the strongest, because only an invalid value is a problem. Blank and missing take the colours of the
// header's value bar.
const VALUE_TINT_CLASSES: Partial<Record<PreviewValueStateId, string>> = {
    blank: 'before:pointer-events-none before:absolute before:inset-0.5 before:rounded-sm before:bg-blank-tint',
    invalid: 'before:pointer-events-none before:absolute before:inset-0.5 before:rounded-sm before:bg-invalid-tint',
    missing: 'before:pointer-events-none before:absolute before:inset-0.5 before:rounded-sm before:bg-missing-tint'
};
const VALUE_TITLE_KEYS: Partial<Record<PreviewValueStateId, keyof typeof TEXT>> = {
    blank: 'value.blank.aria',
    invalid: 'value.invalid.text',
    missing: 'value.missing.aria'
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{
    'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>];
}>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const activeConnectionObjectConfig = shallowRef<ConnectionNodeConfig | undefined>();

// ── Failures ─ A folder that cannot be listed leaves nothing to choose from, so its failure covers the panel. An item
// that cannot be previewed or read only fails that item, so its failure covers the detail and the list stays usable.
const listFailure = shallowRef<AppFailure | undefined>();
const listAttempt = ref(0); // Bumped on retry, which rebuilds the data source and makes the window fetch again.
const itemFailure = shallowRef<AppFailure | undefined>();
const itemAttempt = ref(0); // Bumped on retry, which previews the same item again.

const currentFolderNodes = shallowRef<ConnectionNodeConfig[]>([]);

const currentFolderPath = ref('');

const previewRequestId = ref(0);
const valueStateRequestId = ref(0);
const selectedColumnIndex = ref<number>(); // The column whose detail is showing over the table.
const previewTableComponent = useTemplateRef<{ scrollColumnIntoView: (columnId: string) => void }>('previewTable'); // Typed by what it exposes, because 'Table' is generic.
const activeItemReading = shallowRef<ItemReading>(); // Goes into the draft with the item.
const activeContentAuditConfig = shallowRef<ContentAuditConfig>(); // What the latest audit found, starting from what opening the item read. Its columns are as detected, before any choice of the user's.
const readingIsChanged = ref(false); // The user changed the item or how it is read. Opening the step, or a preview arriving, does not count.

// ── Read Choices ─ How the user chose to read the item, in place of what the preview detected. Cleared for each item.
// What was detected is kept apart, because a preview read the user's way reports their choice, and the selects' Auto
// option still names what detection found.
const selectedDataFormatId = ref<DataFormatId>();
const selectedEncodingId = ref<string>();
const selectedParserId = ref<string>(); // The config id of the tool chosen to read the item.
const selectedValueDelimiterId = ref<ValueDelimiterId>();
const selectedHasHeaders = ref<boolean>();
const detectedDataFormatId = ref<DataFormatId>();
const detectedEncodingId = ref<string>();
const detectedEncodingIsAssumed = ref(false);
const detectedValueDelimiterId = ref<ValueDelimiterId>();
const detectedHasHeaders = ref<boolean>();

// ── Column Types ─ The type and decimal separator the user chose for a column, by its id in the table, which is its
// position. Cleared by every new reading. What was detected is kept apart, so Auto can return to it.
const selectedColumnTypes = ref<ChosenColumnTypes>({});
const selectedDecimalSeparators = ref<ChosenDecimalSeparators>({});
const selectedNullWords = ref<ChosenNullWords>({});
const detectedColumnTypes = shallowRef<DetectedColumnType[]>([]);

// ── Preview Tabs ─ Tabs and their panel reference each other by id, which must be unique on the page. In a narrow
// toolbar the tabs fold into a menu.
const elementIdPrefix = useId();
const currentPreviewTabId = ref<PreviewTabId>('table');
const textViewerComponent = useTemplateRef<InstanceType<typeof TextViewer>>('textViewer');

// ── Toolbar ─ Folds by its own width rather than the screen's, because the panel beside the list can be narrow on any
// screen.
const previewToolbarElement = useTemplateRef<HTMLDivElement>('previewToolbar');
const readChoicesPopoverElement = useTemplateRef<HTMLDivElement>('readChoicesPopover');
const readChoicesPopoverPosition = ref<CSSProperties>({});
const { width: previewToolbarWidth } = useElementSize(previewToolbarElement);
const previewToolbarStageIndex = ref(0);
const previewToolbarFitId = ref(0); // Counts fits, so a fit that a newer one overtook stops.

const previewIsPending = ref(false); // The preview table is empty until the engine answers, which reads as an empty item unless the wait is shown.
const hasLastPreviewSucceeded = ref(false); // Whether the last preview to finish loaded, so the Audit button stays in place while the next item loads.
const previewTableColumnDefinitions = shallowRef<ColumnDef<TableFeatureSet, Record<string, string | null>>[]>([]);
const previewTableDataSource = shallowRef<DataSource<Record<string, string | null>>>({
    rowCount: 0,
    getRows: (): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: [] })
});

const route = useRoute();
const router = useRouter();

// ── Data View
const { data: dataViewConfig } = useCurrentDataView(() => route.params.dataViewId);

// ── Audit
const { abortAudit, auditedByteCount, auditedRecordCount, auditIsRunning, startAudit, stopAudit } = useItemAudit(
    constructEditedDataViewConfig,
    handleItemAudited,
    areHeadersChosen
);

const text = ref<string | undefined>();

// ── Scrolling
const documentScrollElement = shallowRef<HTMLElement>();

// ── Trail
const gridDetailPanelComponent = useTemplateRef<{ detailPaneIsVisible: boolean; isNarrow: boolean; revealSelectedItem: () => void }>('gridDetailPanel'); // Typed by what it exposes, because 'GridDetailPanel' is generic.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The saved connection, which this step lists the items of. Looked up again from the list, so it follows a change of
// language.
const activeConnectionConfig = computed(() => findConnectionLocalisedConfig(dataViewConfig.value?.connectionId));
const activeDataViewConnection = computed(() => (activeConnectionConfig.value ? constructDataViewConnection(activeConnectionConfig.value, localeId.value) : undefined));
const itemSubject = computed(() => activeConnectionConfig.value?.connectorConfig.itemTypeId ?? 'item'); // Wording names the connector's kind of item, e.g. 'File', and falls back to 'item' for a connector released before it said which.

// Every item shows the icon for the connector's kind of item, as the summary row does. A file's real format is only
// known once it is previewed, so its name extension is not used to guess one.
const itemTypeIcon = computed(() => {
    const itemTypeId = activeConnectionConfig.value?.connectorConfig.itemTypeId;
    if (itemTypeId === 'apiEndpoint') return BracesIcon;
    return itemTypeId === 'file' ? FileIcon : SheetIcon; // A connector released before it named its kind of item shows tables, as the summary row does.
});

const backLabel = computed(() => currentFolderNodes.value.at(-1)?.label ?? t(TEXT, 'home.label')); // Names the folder the back button returns to.

// ── Preview ─ A file the preview could not read as text says so on the details tab.
const previewIsUnsupported = computed(() => activeItemReading.value != null && !TEXT_DATA_FORMAT_IDS.has(activeItemReading.value.dataFormatId));
const previewIsMarkdown = computed(() => activeItemReading.value?.dataFormatId === 'markdown'); // The text tab shows markdown rendered rather than as source.

const previewFormatText = computed(() => (activeItemReading.value == null ? undefined : constructDataFormatText(activeItemReading.value.dataFormatId)));
const previewFormatIconConfig = computed(() => {
    const dataFormatId = activeItemReading.value?.dataFormatId;
    return dataFormatId == null || dataFormatId === 'unknown' ? undefined : DATA_FORMAT_ICON_CONFIGS[dataFormatId]; // A file the app cannot place shows no data, so it has no format icon.
});
const previewFormatSupport = computed(() => {
    const dataFormatId = activeItemReading.value?.dataFormatId;
    if (dataFormatId == null || dataFormatId === 'markdown') return; // Markdown is a document, not data, so it is not marked either way.
    let id: FormatSupportId = 'unsupported';
    if (READABLE_DATA_FORMAT_IDS.has(dataFormatId)) id = 'supported';
    else if (PLANNED_DATA_FORMAT_IDS.has(dataFormatId)) id = 'planned';
    return assertDefined(
        FORMAT_SUPPORTS.find((formatSupport) => formatSupport.id === id),
        `Expected a format support with id '${id}'.`
    );
});

// ── Preview Issues ─ Not failures: the preview still holds what was read, so the toolbar, text and details stay usable
// and the user can try another reading. A connector that does not report issues sends none. The band behind the list
// takes the colour of the most serious one.
const sampleIssues = computed(() => activeItemReading.value?.issues ?? []);
const sampleHasErrorIssue = computed(() => sampleIssues.value.some((issue) => issue.severityId === 'error'));
// Each issue says all it can about where it is: its lines, its record and its value within the record, each as its own
// phrase, so a language can order its words. The value at fault shows as it appears in the file.
const sampleIssueItems = computed(() =>
    sampleIssues.value.map((issue, index) => ({
        ...SAMPLE_ISSUE_SEVERITIES[issue.severityId],
        fieldText: issue.fieldNumber == null ? undefined : t(TEXT, 'issue.field.text', { field: formatCount(issue.fieldNumber) }),
        key: `${String(index)}-${issue.id}`,
        lineNumber: issue.lineNumber,
        lineText: constructSampleIssueLineText(issue),
        recordText: issue.recordNumber == null ? undefined : t(TEXT, 'issue.record.text', { record: formatCount(issue.recordNumber) }),
        text: constructSampleIssueText(issue),
        value: issue.value,
        valueName: constructSampleIssueValueName(issue.value)
    }))
);
const sampleIssueCountText = computed(() => {
    const count = sampleIssues.value.length;
    if (count === 0) return;
    return t(TEXT, count === 1 ? 'issue.one.text' : 'issue.other.text', { count });
});
const sampleIssueBandClass = computed(() => {
    const severityId = SAMPLE_ISSUE_SEVERITY_IDS.find((id) => sampleIssues.value.some((issue) => issue.severityId === id));
    return severityId == null ? undefined : SAMPLE_ISSUE_SEVERITIES[severityId].bandClass;
});
// The text tab colours each line an issue names. A line with several issues takes the colour of the most serious.
// Every line an issue covers, from where it starts to where it ends, e.g. all the lines a quote never closed runs over.
const previewLineHighlights = computed(() => {
    const lineHighlights = new Map<number, LineHighlightId>();
    for (const severityId of SAMPLE_ISSUE_SEVERITY_IDS.toReversed()) {
        for (const issue of sampleIssues.value) {
            if (issue.severityId !== severityId || issue.lineNumber == null) continue;
            for (let lineNumber = issue.lineNumber; lineNumber <= (issue.endLineNumber ?? issue.lineNumber); lineNumber++) {
                lineHighlights.set(lineNumber, SAMPLE_ISSUE_SEVERITIES[severityId].lineHighlightId);
            }
        }
    }
    return lineHighlights;
});

// ── Read Options ─ What the toolbar's format and encoding selects offer. Auto comes first, set apart by a line: it
// returns to what detection found, and names it, so a detected value missing from a list, such as a PDF's type, still
// shows. Formats the app has no reader for yet are listed but cannot be chosen.
const dataFormatOptions = computed<SelectOption[]>(() => {
    const supportedGroupLabel = t(TEXT, 'formatGroup.supported.label');
    const plannedGroupLabel = t(TEXT, 'formatGroup.planned.label');
    const documentGroupLabel = t(TEXT, 'formatGroup.document.label');
    const options: SelectOption[] = [
        ...sortOptionsByLabel(Array.from(READABLE_DATA_FORMAT_IDS, (id) => ({ groupLabel: supportedGroupLabel, id, label: constructDataFormatLabel(id) }))),
        ...sortOptionsByLabel(Array.from(PLANNED_DATA_FORMAT_IDS, (id) => ({ groupLabel: plannedGroupLabel, id, isDisabled: true, label: constructDataFormatLabel(id) }))),
        { groupLabel: documentGroupLabel, id: 'markdown', label: constructDataFormatLabel('markdown') } // Shown rendered, so a file read another way can be read as markdown again.
    ];
    const detectedText = detectedDataFormatId.value == null ? undefined : constructDataFormatText(detectedDataFormatId.value);
    return [constructAutoOption(detectedText), ...options];
});

// Only encodings the browser can decode. Each shows its code alone, because its group label names the language, so the
// closed select stays short. Auto says when the encoding was assumed rather than detected; the details tab gives the
// confidence too.
const encodingOptions = computed<SelectOption[]>(() => {
    const options: SelectOption[] = getEncodingTypeConfigs(localeId.value)
        .filter((encodingTypeConfig) => encodingTypeConfig.isDecodable)
        .map(({ groupLabel, id }) => ({ groupLabel: groupLabel === '' ? undefined : groupLabel, id, label: id }));
    return [constructAutoOption(detectedEncodingId.value, detectedEncodingIsAssumed.value), ...options];
});

// The tools that read the previewed format. The select shows only when there is a choice, because most formats have a
// single parser.
const parserToolConfigs = computed(() => {
    const dataFormatId = activeItemReading.value?.dataFormatId;
    return dataFormatId == null ? [] : localiseConfigs(listParserToolConfigs(toolConfigs.value, dataFormatId), localeId.value);
});
const parserOptions = computed<SelectOption[]>(() => parserToolConfigs.value.map(({ id, label }) => ({ id, label })));
const parserIsChoosable = computed(() => parserOptions.value.length > 1);

// A chosen encoding is the user's call. Left on Auto, an encoding the preview only assumed is the one value in doubt.
const encodingSelectTone = computed(() => {
    if (selectedEncodingId.value != null) return 'info';
    return detectedEncodingIsAssumed.value ? 'warning' : undefined;
});

// Delimited text is the only format split by a value delimiter. Auto names the one detected.
const valueDelimiterOptions = computed<SelectOption[]>(() => {
    const detectedId = detectedValueDelimiterId.value;
    const options: SelectOption[] = VALUE_DELIMITER_CONFIGS.map(({ id }) => ({ id, label: constructValueDelimiterLabel(id) }));
    return [constructAutoOption(detectedId == null ? undefined : constructValueDelimiterLabel(detectedId)), ...options];
});
const valueDelimiterIsChoosable = computed(() => activeItemReading.value?.dataFormatId === 'dtv');
const previewHeadersAreChoosable = computed(() => activeItemReading.value?.dataFormatId === 'dtv' && activeItemReading.value.parsedRecords.length > 0);

// Whether the first record names the columns. Auto names what detection found. Each option names headers in full,
// because a closed select shows only its value, and 'Yes' alone would not say what it is about.
const headersOptions = computed<SelectOption[]>(() => {
    const detectedTextKey = detectedHasHeaders.value === true ? 'hasHeaders.option.yes.label' : 'hasHeaders.option.no.label';
    const detectedText = detectedHasHeaders.value == null ? undefined : t(TEXT, detectedTextKey);
    return [
        constructAutoOption(detectedText),
        { id: HEADERS_OPTION_IDS.yes, label: t(TEXT, 'hasHeaders.option.yes.label') },
        { id: HEADERS_OPTION_IDS.no, label: t(TEXT, 'hasHeaders.option.no.label') }
    ];
});

// The value each select shows: the user's choice, or else what the preview detected. Choosing reads the item again. A
// new format clears the chosen parser, which may not read it, and the chosen value delimiter, which may not apply to it.
const previewDataFormatId = computed({
    get: () => selectedDataFormatId.value ?? AUTO_OPTION_ID,
    set: (dataFormatId: string) => {
        readingIsChanged.value = true;
        selectedDataFormatId.value = dataFormatId === AUTO_OPTION_ID ? undefined : (dataFormatId as DataFormatId); // The other options are all format ids.
        selectedParserId.value = undefined;
        selectedValueDelimiterId.value = undefined;
    }
});
const previewHasHeaders = computed({
    get: () => activeItemReading.value?.hasHeaders === true,
    set: (hasHeaders: boolean) => {
        readingIsChanged.value = true;
        selectedHasHeaders.value = hasHeaders;
        if (activeItemReading.value == null) return;
        activeItemReading.value = applyPreviewHeaders(activeItemReading.value, hasHeaders);
        showPreviewTable(activeItemReading.value);
        void recountActivePreview(hasHeaders);
    }
});
// Auto goes back to what detection found. The records already read are only shown and counted again.
const previewHeadersId = computed({
    get: () => {
        if (selectedHasHeaders.value == null) return AUTO_OPTION_ID;
        return selectedHasHeaders.value ? HEADERS_OPTION_IDS.yes : HEADERS_OPTION_IDS.no;
    },
    set: (headersId: string) => {
        const isAuto = headersId === AUTO_OPTION_ID;
        previewHasHeaders.value = isAuto ? detectedHasHeaders.value === true : headersId === HEADERS_OPTION_IDS.yes;
        if (isAuto) selectedHasHeaders.value = undefined;
    }
});
const previewValueDelimiterId = computed({
    get: () => selectedValueDelimiterId.value ?? AUTO_OPTION_ID,
    set: (valueDelimiterId: string) => {
        readingIsChanged.value = true;
        selectedValueDelimiterId.value = valueDelimiterId === AUTO_OPTION_ID ? undefined : (valueDelimiterId as ValueDelimiterId); // The other options are all value delimiter ids.
    }
});
const previewEncodingId = computed({
    get: () => selectedEncodingId.value ?? AUTO_OPTION_ID,
    set: (encodingId: string) => {
        readingIsChanged.value = true;
        selectedEncodingId.value = encodingId === AUTO_OPTION_ID ? undefined : encodingId;
    }
});
const previewParserId = computed({
    get: () => selectedParserId.value ?? activeItemReading.value?.parserId, // No choice yet shows the parser that read the preview.
    set: (parserId: string | undefined) => {
        readingIsChanged.value = true;
        selectedParserId.value = parserId;
    }
});

// ── Store ─ Where Explore loads the records. A change goes straight into the draft, because nothing is read again.
const storeConnections = computed(() => listDataViewStoreConnections());
const storeOptions = computed<SelectOption[]>(() => storeConnections.value.map(({ id, label }) => ({ id, label })));
const storeIsChoosable = computed(() => storeOptions.value.length > 1);
const storeConnectorId = computed({
    get: () => resolveStoreConnectorId(dataViewConfig.value),
    set: (chosenStoreConnectorId: string) => {
        if (dataViewConfig.value != null) changeDataView({ ...dataViewConfig.value, storeConnectorId: chosenStoreConnectorId });
    }
});

// ── Toolbar
const previewToolbarStage = computed(() => assertDefined(PREVIEW_TOOLBAR_STAGES[previewToolbarStageIndex.value], 'Expected a toolbar stage.'));
const auditStatusIsShort = computed(() => previewToolbarStage.value.auditStatusIsShort);
const readChoicesAreFolded = computed(() => previewToolbarStage.value.readChoicesAreFolded);
const readChoiceValuesAreHidden = computed(() => previewToolbarStage.value.readChoiceValuesAreHidden);
const previewTabsAreFolded = computed(() => previewToolbarStage.value.previewTabsAreFolded);
const readChoiceSelectClass = computed(() => (readChoicesAreFolded.value || readChoiceValuesAreHidden.value ? 'flex-none' : 'min-w-22')); // Only a value in the row truncates.
const readChoicesPopoverId = `${elementIdPrefix}-read-choices`;

// How much of the item has been audited, in one form at every stage, with the running figures while an audit runs. A
// percentage whenever the item's size is known, so the meter shows a whole item as complete as well as how little of a large
// one was read. An item not read as bytes has no amount. The toolbar leads with the records and leaves the time to the
// details tab, and shows a percentage only for part of an item.
const auditStatus = computed(() => {
    const contentAuditConfig = activeContentAuditConfig.value;
    if (contentAuditConfig == null) return;
    const isRunning = auditIsRunning.value;
    const byteCount = isRunning ? auditedByteCount.value : contentAuditConfig.byteCount;
    const recordCount = isRunning ? auditedRecordCount.value : contentAuditConfig.recordCount;
    const records = t(TEXT, recordCount === 1 ? 'record.one.text' : 'record.other.text', { count: formatCount(recordCount) });
    const itemSize = activeConnectionObjectConfig.value?.size ?? 0;
    const isComplete = !isRunning && contentAuditConfig.isComplete;
    const stateId = isRunning ? 'running' : 'done';
    if (itemSize === 0 || contentAuditConfig.byteCount === 0) {
        const textKey = `audit.${byteCount === 0 ? 'records' : 'amount'}.${isComplete ? 'complete' : stateId}.text` as const;
        return { isComplete, percentage: undefined, shortText: records, text: t(TEXT, textKey, { amount: formatNumberAsStorageSize(byteCount), records }) };
    }
    const percentage = isComplete ? 100 : Math.min((byteCount / itemSize) * 100, 100);
    const amount = formatNumberAsStorageSize(isComplete ? itemSize : byteCount);
    const percentageText = constructAuditPercentageText(percentage);
    const total = formatNumberAsStorageSize(itemSize);
    return {
        isComplete,
        percentage,
        shortText: isComplete ? records : t(TEXT, 'audit.short.text', { percentage: percentageText, records }),
        text: isComplete
            ? t(TEXT, 'audit.amount.complete.text', { amount, records })
            : t(TEXT, `audit.part.${stateId}.text`, { amount, percentage: percentageText, records, total })
    };
});
const shownAuditStatusText = computed(() => (auditStatusIsShort.value ? auditStatus.value?.shortText : auditStatus.value?.text));

// The details tab's amount, with the share of the item it is whenever the item's size is known. An item not read as bytes
// has no amount.
const auditedAmountText = computed(() => {
    const contentAuditConfig = activeContentAuditConfig.value;
    if (contentAuditConfig == null || contentAuditConfig.byteCount === 0) return;
    const itemSize = activeConnectionObjectConfig.value?.size ?? 0;
    if (itemSize === 0) return formatNumberAsStorageSize(contentAuditConfig.byteCount);
    if (contentAuditConfig.isComplete) return t(TEXT, 'audit.detail.complete.text', { amount: formatNumberAsStorageSize(itemSize), percentage: constructAuditPercentageText(100) });
    const percentage = constructAuditPercentageText(Math.min((contentAuditConfig.byteCount / itemSize) * 100, 100));
    return t(TEXT, 'audit.detail.part.text', { amount: formatNumberAsStorageSize(contentAuditConfig.byteCount), percentage, total: formatNumberAsStorageSize(itemSize) });
});

// The next few sizes larger than what has been audited and smaller than the item, then the whole item.
const auditChoices = computed<AuditChoice[]>(() => {
    const auditedBytes = activeContentAuditConfig.value?.byteCount ?? 0;
    const itemSize = activeConnectionObjectConfig.value?.size ?? Infinity;
    const byteLimits = AUDIT_BYTE_LIMITS.filter((byteLimit) => byteLimit > auditedBytes && byteLimit < itemSize).slice(0, AUDIT_CHOICE_LIMIT);
    const sizeChoices = byteLimits.map((byteLimit) => ({ byteLimit, id: String(byteLimit), label: formatNumberAsStorageSize(byteLimit) }));
    return [...sizeChoices, { byteLimit: undefined, id: 'all', label: t(TEXT, 'audit.all.label') }];
});

// The records and text only hold the start of the item, however much of it has been audited. Said only when the audit
// covered more than the preview holds, because until then the audited amount beside it already says the same.
const previewExtentText = computed(() => {
    const previewSize = activeItemReading.value?.size;
    const itemSize = activeConnectionObjectConfig.value?.size;
    if (previewSize == null || previewSize === 0 || previewSize === itemSize || currentPreviewTabId.value === 'details') return;
    const auditedSize = auditIsRunning.value ? auditedByteCount.value : activeContentAuditConfig.value?.byteCount;
    if (auditedSize != null && auditedSize <= previewSize) return;
    return t(TEXT, 'preview.extent.text', { size: formatNumberAsStorageSize(previewSize) });
});

const currentPreviewTab = computed(() =>
    assertDefined(
        PREVIEW_TABS.find((previewTab) => previewTab.id === currentPreviewTabId.value),
        `Expected a preview tab with id '${currentPreviewTabId.value}'.`
    )
);

// Delimited text can be selected from any tab.
// TODO: Let the user override how the item is read: its format, delimiter, header row and encoding. Changing one
// re-reads the preview, and the others stay as detected. Save the choice with the item, so the audit reads the file the
// same way. Then the tabs only show the item, and Select is enabled when the format in force is delimited text, JSON or
// JSON Lines and gave at least one row.
const previewIsSelectable = computed(() => {
    const itemReading = activeItemReading.value;
    if (itemReading == null || itemReading.parsedRecords.length === 0 || sampleHasErrorIssue.value) return false;
    const isOpenedAsTable = TEXT_DATA_FORMAT_IDS.has(itemReading.dataFormatId) && currentPreviewTabId.value === 'table';
    return TABLE_DATA_FORMAT_IDS.has(itemReading.dataFormatId) || isOpenedAsTable;
});

// ── Explore ─ Why it is dimmed, shown as its tooltip.
const exploreDisabledReason = computed(() => t(TEXT, auditIsRunning.value ? 'explore.auditRunning.text' : 'explore.noData.text'));

// Names the format when there is one, which is every format the app has no reader for yet.
const previewUnsupportedText = computed(() => {
    const itemReading = activeItemReading.value;
    if (itemReading?.size === 0) return t(TEXT, 'item.empty.text');
    if (itemReading == null || itemReading.dataFormatId === 'unknown') return t(TEXT, 'item.unsupported.text');
    return t(TEXT, 'item.unsupportedFormat.text', { format: constructDataFormatLabel(itemReading.dataFormatId) });
});

// The details tab is a read-only document of what the toolbar's choices produced. It lists only the facts there are: a
// listing or a preview can leave any of them out. The first section is about the item itself, the second about its
// content and the third about how it was parsed.
// Read choices change how the item is read, so they wait for an audit of the current reading to finish.
const readChoicesAreLocked = computed(() => previewIsPending.value || auditIsRunning.value);
const auditActionIsShown = computed(() => activeItemReading.value != null && previewIsSelectable.value);

const itemDetailGroups = computed(() => {
    const connectionNodeConfig = activeConnectionObjectConfig.value;
    const itemReading = activeItemReading.value;
    if (connectionNodeConfig == null || itemReading == null) return [];
    const detailGroups: { id: string; title: string; details: { labelKey: keyof typeof TEXT; value: string | undefined }[] }[] = [
        {
            id: 'item',
            title: t(TEXT, `${itemSubject.value}.label`),
            details: [
                { labelKey: 'detail.folder.label', value: connectionNodeConfig.folderPath === '' ? '/' : connectionNodeConfig.folderPath }, // An item at the top of its connection has an empty folder path, shown as the top folder.
                {
                    labelKey: 'detail.name.label',
                    value: connectionNodeConfig.extension == null ? connectionNodeConfig.name : `${connectionNodeConfig.name}.${connectionNodeConfig.extension}`
                },
                { labelKey: 'detail.fileType.label', value: itemReading.fileType?.mime ?? connectionNodeConfig.mimeType },
                { labelKey: 'detail.size.label', value: formatNumberAsStorageSize(connectionNodeConfig.size) },
                {
                    labelKey: 'detail.lastModified.label',
                    value:
                        connectionNodeConfig.lastModifiedAt == null
                            ? undefined
                            : new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeStyle: 'short' }).format(connectionNodeConfig.lastModifiedAt)
                }
            ]
        },
        {
            id: 'content',
            title: t(TEXT, 'detail.content.title'),
            details: [
                { labelKey: 'detail.dataFormat.label', value: previewFormatText.value },
                { labelKey: 'detail.encoding.label', value: constructEncodingText(itemReading) },
                { labelKey: 'detail.issues.label', value: sampleIssueCountText.value } // Listed in the band above the tabs.
            ]
        },
        {
            id: 'parsing',
            title: t(TEXT, 'detail.parsing.title'),
            details: [
                { labelKey: 'parser.label', value: parserOptions.value.find((option) => option.id === itemReading.parserId)?.label },
                { labelKey: 'recordDelimiter.label', value: constructRecordDelimiterText(itemReading) },
                { labelKey: 'valueDelimiter.label', value: constructValueDelimiterText(itemReading) },
                { labelKey: 'hasHeaders.label', value: constructHeadersText(itemReading) }
            ]
        }
    ];
    if (activeContentAuditConfig.value) detailGroups.push(constructAuditDetailGroup(activeContentAuditConfig.value));
    return detailGroups
        .map((detailGroup) => ({ ...detailGroup, details: detailGroup.details.filter((detail) => detail.value != null && detail.value !== '') }))
        .filter((detailGroup) => detailGroup.details.length > 0);
});

// A column also needs checking when values do not fit a type the user chose, because a load stores them as empty.
const columnRowsNeedingAttention = computed(() => {
    const itemReading = activeItemReading.value;
    const columnConfigs = itemReading?.columnConfigs ?? [];
    const columnIndexes = columnConfigs.map((_config, index) => index);
    return new Set(
        columnIndexes.filter(
            (index) =>
                (columnConfigs[index]?.invalidValueCount ?? 0) > 0 ||
                columnConfigs[index]?.isFormatAmbiguous === true ||
                (itemReading != null && countChosenTypeMisfits(itemReading, index, detectedColumnTypes.value[index]) > 0)
        )
    );
});
const previewValueStates = shallowRef<PreviewValueStateId[][]>([]); // For each record shown, what each value is. Only the engine can tell whether a value fits its type.
const columnValueCounts = computed(() => (activeItemReading.value == null ? [] : constructColumnValueCounts(activeItemReading.value)));
// The table shows the item's own columns, which come before every derived one.
const tableColumnIndexes = computed(() =>
    (activeItemReading.value?.columnConfigs ?? []).map((columnConfig, index) => (isDerivedColumn(columnConfig) ? undefined : index)).filter((index) => index !== undefined)
);
// The columns the toolbar's search can find: the table's own, because a derived column only holds values for another.
const columnSearchOptions = computed((): ColumnSearchOption[] => {
    const columnRows = activeItemReading.value == null ? [] : constructPreviewColumnRows(activeItemReading.value);
    return tableColumnIndexes.value.map((columnIndex) => ({
        id: String(columnIndex),
        label: columnRows[columnIndex]?.label ?? '',
        needsAttention: columnRowsNeedingAttention.value.has(columnIndex)
    }));
});
const columnSearchIsShown = computed(() => currentPreviewTabId.value === 'table' && columnSearchOptions.value.length > 1);
const selectedColumnStepIndex = computed(() => {
    const stepIndex = selectedColumnIndex.value == null ? -1 : tableColumnIndexes.value.indexOf(selectedColumnIndex.value);
    return stepIndex === -1 ? undefined : stepIndex;
});
const connectionNodeConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionNodeConfig>>>(() => {
    const folderPath = currentFolderPath.value; // Read synchronously so this computed (and useDataWindow's cache) resets on navigation.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- Read so Vue tracks it as a dependency.
    listAttempt.value; // Read for the same reason: a retry has to produce a new data source for the window to refetch.
    return {
        rowCount: undefined, // Unknown until the first listNodes response reports totalCount — useDataWindow guarantees that fetch happens.
        getRows: async (start: number, end: number): Promise<{ rows: LocalisedConfig<ConnectionNodeConfig>[]; totalCount: number }> => {
            try {
                const activeConnection = await waitForActiveConnectionConfig();
                const { processRequest } = await establishEngineWorker();
                const result = (await processRequest('listNodes', activeConnection, {
                    folderPath,
                    limit: end - start,
                    offset: start
                } as ListNodesOptions)) as ListNodesResult;
                return { rows: result.connectionNodeConfigs, totalCount: result.totalCount };
            } catch (error) {
                // Settled with an empty page as well as raised: the window is waiting on this promise, and a rejection
                // would leave it loading behind the failure it is being told about.
                const data = { folderPath, typeId: 'handled' };
                listFailure.value = raiseFailure(new AppError('Failed to list the items in this connection.', 'dpuse-app.SelectItemPanel.getRows', data, { cause: error }));
                return { rows: [], totalCount: 0 };
            }
        }
    };
});

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// The data view header shows this step's trail, so the trail stays in place between steps and its folders can be opened.
// A narrow screen shows the preview in place of the list, so there the trail gives way to one button back to it.
useItemStepTrail(() => ({
    backLabel: gridDetailPanelComponent.value?.isNarrow === true && activeConnectionObjectConfig.value != null ? backLabel.value : undefined,
    folderNodeConfigs: currentFolderNodes.value,
    itemConfig: activeConnectionObjectConfig.value,
    returnToList: handleReturnToList,
    revealItem: (): void => gridDetailPanelComponent.value?.revealSelectedItem(),
    selectFolder: handleSelectBreadcrumb
}));

// Opens the saved item's folder with the item selected, so a reload or a return to this step shows what was saved; a
// pick that was never saved is not restored. Keyed on the connection's id, so a change of language, which re-localises
// the same connection, does not send the list back to the top folder.
watch(
    () => activeConnectionConfig.value?.id,
    () => {
        const savedItemConfig = dataViewConfig.value?.connectionNodeConfig;
        currentFolderNodes.value = savedItemConfig ? constructFolderNodeConfigs(savedItemConfig.folderPath) : [];
        activeConnectionObjectConfig.value = savedItemConfig;
        loadFolderNodes(activeConnectionConfig.value, savedItemConfig?.folderPath ?? '');
    },
    { immediate: true }
);

// Immediate, because the saved item can already be selected at mount, and its preview must still load. Also run on a
// retry of the item, and a new selection or retry clears the item's last failure. A new read choice keeps the current
// preview on show while the item is read again, so the toolbar, and the select the user is on, stay in place.
watch(
    [activeConnectionObjectConfig, itemAttempt, selectedDataFormatId, selectedEncodingId, selectedParserId, selectedValueDelimiterId],
    async ([newActiveItem, newItemAttempt], oldValues) => {
        const currentRequestId = ++previewRequestId.value;
        itemFailure.value = undefined;
        const [oldActiveItem, oldItemAttempt] = oldValues; // Empty on the first, immediate run, which is never a read choice.
        const isNewReadChoice = newActiveItem === oldActiveItem && newItemAttempt === oldItemAttempt;
        if (!isNewReadChoice) {
            resetPreviewState();
            detectedDataFormatId.value = undefined;
            detectedEncodingId.value = undefined;
            detectedValueDelimiterId.value = undefined;
            detectedHasHeaders.value = undefined;
        }
        if (newActiveItem == null) return;

        previewIsPending.value = true;
        try {
            const { processRequest } = await establishEngineWorker();
            if (!activeConnectionConfig.value) return;

            const options = constructPreviewOptions(newActiveItem, isNewReadChoice);
            const previewObjectResult = (await processRequest('previewObject', activeConnectionConfig.value, options)) as PreviewObjectResult;
            if (currentRequestId !== previewRequestId.value || activeConnectionObjectConfig.value !== newActiveItem) return;

            const itemReading = constructItemReading(previewObjectResult);
            const headedItemReading = await applyHeaderChoice(itemReading, newActiveItem);
            if (currentRequestId !== previewRequestId.value) return;

            const wereColumnTypesChosen = [
                ...Object.values(selectedColumnTypes.value),
                ...Object.values(selectedDecimalSeparators.value),
                ...Object.values(selectedNullWords.value)
            ].some((choice) => choice != null);
            selectedColumnTypes.value = isNewReadChoice ? {} : constructSavedColumnTypes(newActiveItem); // A new reading can change the columns, but reopening the saved item keeps its types.
            selectedDecimalSeparators.value = isNewReadChoice ? {} : constructSavedDecimalSeparators(newActiveItem);
            selectedNullWords.value = isNewReadChoice || !isSavedItem(newActiveItem) ? {} : constructChosenNullWords(dataViewConfig.value?.columnChoiceConfigs);
            detectedColumnTypes.value = constructDetectedColumnTypes(headedItemReading);
            if (isNewReadChoice) selectedColumnIndex.value = undefined; // A new reading can change the columns.
            activeContentAuditConfig.value = constructFirstContentAuditConfig(previewObjectResult.contentAuditConfig, headedItemReading);
            const typedItemReading = isNewReadChoice ? headedItemReading : applySavedAudit(headedItemReading, newActiveItem);
            applyItemReading(isNewReadChoice && wereColumnTypesChosen ? addColumnTypesResetIssue(typedItemReading) : typedItemReading, isNewReadChoice);
            recordDetectedValues(itemReading);
            hasLastPreviewSucceeded.value = true;
        } catch (error) {
            if (currentRequestId !== previewRequestId.value) return; // A newer selection owns the panel now.
            const data = { typeId: 'handled' };
            itemFailure.value = raiseFailure(new AppError('Failed to preview this item.', 'dpuse-app.SelectItemPanel', data, { cause: error }));
            hasLastPreviewSucceeded.value = false;
        } finally {
            if (currentRequestId === previewRequestId.value) previewIsPending.value = false; // A newer selection owns the busy state now.
        }
    },
    { immediate: true }
);

// Each change of the item, its reading or a column's type goes into the draft once the preview shows it. A reading that
// cannot be selected leaves the draft with no item, so it cannot be saved. Opening a markdown file as a table can make
// it selectable without a new preview.
watch([activeItemReading, previewIsSelectable], ([itemReading]) => {
    if (itemReading == null || !readingIsChanged.value) return;
    changeDataView(constructEditedDataViewConfig() ?? constructItemlessDataViewConfig());
});

// Fits the toolbar again whenever its room or its content changes. 'post', so the toolbar shows the new content first.
// Watches nothing a stage sets, such as the audit text it shows, or fitting would set off another fit without end.
watch(
    [
        previewToolbarWidth,
        previewFormatText,
        parserIsChoosable,
        storeIsChoosable,
        previewHeadersAreChoosable,
        (): string | undefined => auditStatus.value?.text,
        auditIsRunning,
        columnSearchIsShown,
        localeId
    ],
    fitPreviewToolbar,
    { flush: 'post' }
);

// Widening the toolbar puts the read choices back in its row, which would leave their popover open and empty.
watch(readChoicesAreFolded, (areFolded) => {
    if (!areFolded && readChoicesPopoverElement.value?.matches(':popover-open') === true) readChoicesPopoverElement.value.hidePopover();
});

// Goes by the column types, so choosing a type marks the values again. Empty until the engine answers, so a mark never
// describes the wrong records.
watch(activeItemReading, async (itemReading) => {
    const currentRequestId = ++valueStateRequestId.value;
    previewValueStates.value = [];
    if (itemReading == null || !activeConnectionConfig.value || itemReading.parsedRecords.length === 0) return;
    try {
        const { processRequest } = await establishEngineWorker();
        const options: ClassifyPreviewValuesOptions = {
            columnConfigs: itemReading.columnConfigs,
            parsedRecords: itemReading.parsedRecords.slice(itemReading.hasHeaders === true ? 1 : 0)
        };
        const valueStates = (await processRequest('classifyPreviewValues', activeConnectionConfig.value, options)) as PreviewValueStateId[][];
        if (currentRequestId === valueStateRequestId.value) previewValueStates.value = valueStates;
    } catch (error) {
        if (currentRequestId === valueStateRequestId.value)
            raiseFailure(new AppError('Failed to check the preview values.', 'dpuse-app.SelectItemPanel.classifyPreviewValues', { typeId: 'handled' }, { cause: error }));
    }
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Clearing the failure alone would show the panel again with the same empty window behind it, so the attempt count is
// bumped too: that rebuilds the data source, which is what makes the window ask for its rows a second time.
function handleRetryList(): void {
    listFailure.value = undefined;
    listAttempt.value++;
}

// A change of type keeps the records, so nothing is read again and the table stays as it is.
function handleSelectColumnType(columnId: string, columnTypeId: string): void {
    const columnIndex = Number(columnId);
    const detectedColumnType = detectedColumnTypes.value.at(columnIndex);
    if (detectedColumnType == null || activeItemReading.value == null) return;
    readingIsChanged.value = true;
    const chosenColumnType = CHOOSABLE_COLUMN_TYPES.find((columnType) => constructColumnTypeId(columnType) === columnTypeId); // Auto is not one of them, so it chooses none.
    selectedColumnTypes.value[columnId] = chosenColumnType;
    const typedItemReading = applyPreviewColumnType(activeItemReading.value, columnIndex, chosenColumnType, detectedColumnType);
    activeItemReading.value = applyPreviewDecimalSeparators(typedItemReading, selectedDecimalSeparators.value, selectedColumnTypes.value); // A detected type brings back the detected separator.
    showPreviewColumns(activeItemReading.value);
}

// Only how the column's values read changes, so nothing is read again.
function handleSelectNullWords(columnId: string, areNullWordsEmpty: boolean): void {
    if (activeItemReading.value == null) return;
    readingIsChanged.value = true;
    selectedNullWords.value[columnId] = areNullWordsEmpty;
    activeItemReading.value = applyPreviewNullWordChoice(activeItemReading.value, Number(columnId), areNullWordsEmpty);
}

// For a column whose values did not settle it. Only how the values read changes, so nothing is read again.
function handleSelectDecimalSeparator(columnId: string, decimalSeparatorValue: string): void {
    if (activeItemReading.value == null) return;
    const columnIndex = Number(columnId);
    readingIsChanged.value = true;
    const chosenDecimalSeparatorId = decimalSeparatorValue === AUTO_OPTION_ID ? undefined : (decimalSeparatorValue as DecimalSeparatorId); // The other options are both separators.
    selectedDecimalSeparators.value[columnId] = chosenDecimalSeparatorId;
    const decimalSeparatorId = chosenDecimalSeparatorId ?? detectedColumnTypes.value.at(columnIndex)?.decimalSeparatorId;
    activeItemReading.value = applyPreviewDecimalSeparator(activeItemReading.value, columnIndex, decimalSeparatorId, selectedColumnTypes.value[columnId] != null);
    showPreviewColumns(activeItemReading.value);
}

function handleRetryItem(): void {
    itemAttempt.value++;
}

// Index 0 is the connection's top folder, and each folder below it follows.
function handleSelectBreadcrumb(index: number): void {
    pickItem();
    const folderNodeConfig = index <= 0 ? undefined : currentFolderNodes.value[index - 1];
    currentFolderNodes.value = currentFolderNodes.value.slice(0, Math.max(index, 0));
    loadFolderNodes(activeConnectionConfig.value, folderNodeConfig ? `${folderNodeConfig.folderPath}/${folderNodeConfig.name}` : '');
}

function handleSelectConnectionNode(connectionNodeConfig: ConnectionNodeConfig | undefined): void {
    if (connectionNodeConfig == null) {
        pickItem(); // Clears the selection.
        return;
    }

    if (connectionNodeConfig.typeId === 'folder') {
        currentFolderNodes.value = [...currentFolderNodes.value, connectionNodeConfig];
        pickItem();
        loadFolderNodes(activeConnectionConfig.value, `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`);
        return;
    }

    pickItem(connectionNodeConfig);
}

// Narrow screens show the preview in place of the list. Going back does what the last breadcrumb does.
function handleReturnToList(): void {
    handleSelectBreadcrumb(currentFolderNodes.value.length);
}

// Arrow keys, Home and End move between tabs and select as they go, since only the selected tab is in the tab order.
// They skip a disabled tab, which cannot be selected.
function handleNavigatePreviewTabs(event: KeyboardEvent, previewTabIndex: number): void {
    const nextIndexByKey: Partial<Record<string, number>> = {
        ArrowLeft: stepToEnabledPreviewTabIndex(previewTabIndex, -1),
        ArrowRight: stepToEnabledPreviewTabIndex(previewTabIndex, 1),
        End: stepToEnabledPreviewTabIndex(0, -1),
        Home: stepToEnabledPreviewTabIndex(PREVIEW_TABS.length - 1, 1)
    };
    const nextIndex = nextIndexByKey[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    currentPreviewTabId.value = assertDefined(PREVIEW_TABS[nextIndex]).id;
    const tabElements = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="tab"]');
    tabElements?.[nextIndex]?.focus();
}

// Opens the text on the line an issue names, so the user sees what the parser could not read.
async function handleShowIssueLine(lineNumber: number): Promise<void> {
    currentPreviewTabId.value = 'text';
    await nextTick(); // The text is only laid out once its tab shows.
    textViewerComponent.value?.scrollToLine(lineNumber);
}

function constructValueState(columnId: string, rowIndex: number): PreviewValueStateId | undefined {
    return previewValueStates.value[rowIndex]?.[Number(columnId)];
}

// Numbers sit to the right, with digits of one width, so they can be compared by size.
function constructValueCellClass(columnId: string, rowIndex: number): string {
    const dataTypeClass = constructDataTypeCellClass(activeItemReading.value?.columnConfigs[Number(columnId)]?.dataTypeId) ?? '';
    return `${dataTypeClass} ${VALUE_TINT_CLASSES[constructValueState(columnId, rowIndex) ?? 'valid'] ?? ''}`;
}

function constructValueCellTitle(columnId: string, rowIndex: number): string | undefined {
    const titleKey = VALUE_TITLE_KEYS[constructValueState(columnId, rowIndex) ?? 'valid'];
    return titleKey == null ? undefined : t(TEXT, titleKey);
}

function isNumericColumn(columnId: string): boolean {
    return activeItemReading.value?.columnConfigs[Number(columnId)]?.dataTypeId === 'numeric';
}

function findRecordValue(columnId: string, rowIndex: number): string {
    const dataRecordIndex = rowIndex + (activeItemReading.value?.hasHeaders === true ? 1 : 0);
    return activeItemReading.value?.parsedRecords[dataRecordIndex]?.[Number(columnId)]?.value ?? '';
}

// A number split for display with its decimal padding, so the decimal points line up while the value still reads exactly
// as it is written. None when the number needs no padding, so the cell shows its plain value.
function constructValueDecimalPadding(columnId: string, rowIndex: number): ReturnType<typeof constructDecimalPadding> | undefined {
    const columnConfig = activeItemReading.value?.columnConfigs[Number(columnId)];
    const isPadded = columnConfig?.dataTypeId === 'numeric' && constructValueState(columnId, rowIndex) === 'valid';
    if (!isPadded) return undefined;
    const valuePadding = constructDecimalPadding(findRecordValue(columnId, rowIndex), columnConfig, constructColumnEnding(columnConfig.formats));
    return valuePadding.hiddenPadding === '' && valuePadding.shownPadding === '' ? undefined : valuePadding;
}

// A blank value can hold spaces, and a missing one can be a null word such as 'NULL', which still shows as written.
function isValueEmpty(columnId: string, rowIndex: number): boolean {
    const valueState = constructValueState(columnId, rowIndex);
    return (valueState === 'blank' || valueState === 'missing') && findRecordValue(columnId, rowIndex).trim() === '';
}

// No value is missing. Only the whole item can show that.
function isRequiredColumn(columnId: string): boolean {
    return activeContentAuditConfig.value?.isComplete === true && activeItemReading.value?.columnConfigs[Number(columnId)]?.isRequired === true;
}

// Every value is unique and none is missing, so the column could identify each record.
function isKeyColumn(columnId: string): boolean {
    return isRequiredColumn(columnId) && activeItemReading.value?.columnConfigs[Number(columnId)]?.isUnique === true;
}

// The detail opens in the tab the user is in, so they keep their place. The table scrolls the clicked column's tab into
// view, as it does for Previous and Next. A click on the selected column's tab closes its detail, as the ✕ does.
function handleToggleColumnDetail(columnIndex: number): void {
    if (selectedColumnIndex.value === columnIndex) {
        selectedColumnIndex.value = undefined;
        return;
    }
    selectedColumnIndex.value = columnIndex;
    if (currentPreviewTabId.value === 'table') previewTableComponent.value?.scrollColumnIntoView(String(columnIndex));
}

// Previous and Next step through the table's columns, which are the item's own. The table scrolls to keep the chosen
// column's name in view.
function handleStepColumn(direction: -1 | 1): void {
    const stepIndex = selectedColumnStepIndex.value;
    if (stepIndex == null) return;
    const nextStepIndex = stepIndex + direction;
    const nextColumnIndex = nextStepIndex < 0 ? undefined : tableColumnIndexes.value.at(nextStepIndex); // 'at' would read a negative index from the end.
    if (nextColumnIndex == null) return;
    selectedColumnIndex.value = nextColumnIndex;
    if (currentPreviewTabId.value === 'table') previewTableComponent.value?.scrollColumnIntoView(String(nextColumnIndex));
}

// The field takes focus as it opens, so the user can type straight away.
// A column found with the toolbar's search opens its detail, and the table scrolls to it, as it does for Previous and Next.
function handleSelectColumn(columnIndex: number): void {
    selectedColumnIndex.value = columnIndex;
    if (currentPreviewTabId.value === 'table') previewTableComponent.value?.scrollColumnIntoView(String(columnIndex));
}

// The folded read choices open below the toolbar, lined up with its start, where their button is. Placed before they
// show, so they never appear in the wrong place first.
function handlePlaceReadChoices(event: ToggleEvent): void {
    const toolbarBounds = previewToolbarElement.value?.getBoundingClientRect();
    if (toolbarBounds == null || event.newState !== 'open') return;
    const top = toolbarBounds.bottom + READ_CHOICES_GAP_PX;
    readChoicesPopoverPosition.value = {
        left: `${String(Math.max(VIEWPORT_MARGIN_PX, toolbarBounds.left))}px`,
        maxHeight: `${String(innerHeight - top - VIEWPORT_MARGIN_PX)}px`,
        maxWidth: `${String(document.documentElement.clientWidth - 2 * VIEWPORT_MARGIN_PX)}px`,
        top: `${String(top)}px`
    };
}

function handleSelectPreviewTab(previewTabId: PreviewTabId): void {
    currentPreviewTabId.value = previewTabId;
}

// The pill asks for the data, so Explore loads it straight away.
function handleMoveToExploreStep(): void {
    if (constructEditedDataViewConfig() == null || auditIsRunning.value) return;

    emit('task-completed', taskLocalisedConfig);
    void ignoreReportedNavigationFailure(router.push({ name: 'data', params: { dataViewId: route.params.dataViewId }, query: route.query, state: { loadIsRequested: true } }));
}

// The preview grows first, so the records and text shown keep up with the audit until they reach their limit. Reading it
// audits it too, so a size no larger than the preview needs nothing more.
async function handleStartAudit(byteLimit: number | undefined): Promise<void> {
    try {
        const auditResult = await readLargerPreview();
        if (byteLimit !== PREVIEW_BYTE_LIMIT) await startAudit(byteLimit);
        else if (auditResult) handleItemAudited(auditResult);
    } catch (error) {
        itemFailure.value = raiseFailure(new AppError('Failed to preview this item.', 'dpuse-app.SelectItemPanel.handleStartAudit', { typeId: 'handled' }, { cause: error }));
    }
}

// An audit reads more records than the preview, so it can find a header the preview missed. The first record then moves
// out of the table's rows and names the columns.
// A parser that only counts records returns no columns, so the columns already detected stay.
function handleItemAudited({ contentAuditConfig, hasHeaders }: AuditObjectContentResult): void {
    const itemReading = activeItemReading.value;
    if (itemReading == null) return;
    const headersAreFound = hasHeaders && itemReading.hasHeaders !== true;
    if (headersAreFound && selectedHasHeaders.value == null) detectedHasHeaders.value = true;
    const auditedItemReading = headersAreFound ? { ...itemReading, hasHeaders: true } : itemReading;
    const columnConfigs = contentAuditConfig.columns.length > 0 ? contentAuditConfig.columns : (activeContentAuditConfig.value?.columns ?? []);
    const detectedItemReading = applyPreviewHeaders({ ...auditedItemReading, columnConfigs }, auditedItemReading.hasHeaders === true);
    activeContentAuditConfig.value = { ...contentAuditConfig, columns: detectedItemReading.columnConfigs };
    activeItemReading.value = applyAuditColumns(auditedItemReading, columnConfigs);
    if (headersAreFound) showPreviewTable(activeItemReading.value);
    else showPreviewColumns(activeItemReading.value);
    const auditedDataViewConfig = constructEditedDataViewConfig();
    if (auditedDataViewConfig) changeDataView(auditedDataViewConfig);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Shows the first stage whose content fits the toolbar's width, trying each in turn from the fullest. Each stage is laid
// out and measured before the browser paints, so the stages tried and passed over never show. The last stage stays
// even if it still does not fit, because there is nothing more to give up.
async function fitPreviewToolbar(): Promise<void> {
    const toolbarElement = previewToolbarElement.value;
    if (toolbarElement == null || previewToolbarWidth.value === 0) return;
    const fitId = ++previewToolbarFitId.value;
    for (const stageIndex of PREVIEW_TOOLBAR_STAGES.keys()) {
        previewToolbarStageIndex.value = stageIndex;
        await nextTick();
        if (fitId !== previewToolbarFitId.value || toolbarElement.scrollWidth <= toolbarElement.clientWidth) return;
    }
}

// The data view as the current pick and preview would leave it. Undefined until there is something that can be kept.
function constructEditedDataViewConfig(): DataViewConfig | undefined {
    const connectionNodeConfig = activeConnectionObjectConfig.value;
    const itemReading = activeItemReading.value;
    const contentAuditConfig = activeContentAuditConfig.value;
    if (connectionNodeConfig == null || itemReading == null || contentAuditConfig == null || !previewIsSelectable.value || dataViewConfig.value == null) return;

    const readingConfig: ReadingConfig = {
        ...constructReadingConfig(itemReading),
        dataFormatId: TABLE_DATA_FORMAT_IDS.has(itemReading.dataFormatId) ? itemReading.dataFormatId : 'dtv' // Markdown opened as a table was parsed as delimited text, so it is saved as that.
    };
    return {
        ...dataViewConfig.value,
        connectionNodeConfig,
        readingConfig,
        sampleConfig: constructSampleConfig(itemReading),
        contentAuditConfig,
        columnChoiceConfigs: constructColumnChoiceConfigs(selectedColumnTypes.value, selectedDecimalSeparators.value, selectedNullWords.value)
    };
}

// Up to two decimal places, rounded down so a part of an item never reads as all of it. An amount too small to show
// reads as under 0.01 rather than 0, because some of the item was read.
function constructAuditPercentageText(percentage: number): string {
    const shownPercentage = Math.floor(percentage * 100) / 100;
    const isTooSmallToShow = percentage > 0 && shownPercentage === 0;
    const percentageText = formatNumberAsDecimalNumber(isTooSmallToShow ? 0.01 : shownPercentage, 2, 0, localeId.value);
    return isTooSmallToShow ? `<${percentageText}` : percentageText;
}

// Read again after waiting rather than taken from 'until', which resolves on the timeout too.
async function waitForActiveConnectionConfig(): Promise<LocalisedConfig<ConnectionConfig>> {
    await until(activeConnectionConfig).toBeTruthy({ timeout: ACTIVE_CONNECTION_CONFIG_WAIT_TIMEOUT_MS });
    if (activeConnectionConfig.value == null) throw new Error('Timed out waiting for an active connection config.');
    return activeConnectionConfig.value;
}

// What the user chose first. The data view's own item then opens the way the data view reads it, not as detection would
// read it afresh.
function constructPreviewOptions(connectionNodeConfig: ConnectionNodeConfig, isNewReadChoice: boolean): PreviewObjectOptions {
    const isOwnItem = !isNewReadChoice && isDataViewItem(connectionNodeConfig);
    const dataViewReading = isOwnItem ? dataViewConfig.value?.readingConfig : undefined;
    const savedPreviewSize = isOwnItem ? dataViewConfig.value?.sampleConfig?.size : undefined;
    return {
        chunkSize: savedPreviewSize != null && savedPreviewSize > 0 ? savedPreviewSize : undefined, // A preview that grew reads as much again.
        dataFormatId: selectedDataFormatId.value ?? dataViewReading?.dataFormatId,
        encodingId: selectedEncodingId.value ?? dataViewReading?.encodingId,
        extension: undefined,
        mimeType: connectionNodeConfig.mimeType,
        parserId: selectedParserId.value ?? dataViewReading?.parserId,
        path: constructItemPath(connectionNodeConfig),
        valueDelimiterId: selectedValueDelimiterId.value ?? dataViewReading?.valueDelimiterId
    };
}

// Only picking a different item changes the data view. Browsing folders, or clearing the selection, leaves it as it is.
function pickItem(connectionNodeConfig?: ConnectionNodeConfig): void {
    abortAudit(); // An audit reads one item, so it ends when the user moves to another.
    selectedColumnIndex.value = undefined;
    activeConnectionObjectConfig.value = connectionNodeConfig;
    selectedDataFormatId.value = undefined;
    selectedEncodingId.value = undefined;
    selectedParserId.value = undefined;
    selectedValueDelimiterId.value = undefined;
    selectedHasHeaders.value = undefined;
    if (connectionNodeConfig == null || isDataViewItem(connectionNodeConfig)) return;

    readingIsChanged.value = true;
    changeDataView(constructItemlessDataViewConfig());
}

// The later steps are cleared, because they were worked out from the item being replaced.
function constructItemlessDataViewConfig(): DataViewConfig {
    return {
        ...assertDefined(dataViewConfig.value, 'No data view to change.'),
        connectionNodeConfig: undefined,
        readingConfig: undefined,
        sampleConfig: undefined,
        contentAuditConfig: undefined,
        columnChoiceConfigs: undefined
    };
}

function isDataViewItem(connectionNodeConfig: ConnectionNodeConfig): boolean {
    const itemConfig = dataViewConfig.value?.connectionNodeConfig;
    return itemConfig != null && constructItemPath(itemConfig) === constructItemPath(connectionNodeConfig);
}

// The breadcrumb trail down to a folder, rebuilt from its path because only the item itself is saved. Each crumb's
// 'folderPath' and 'name' join back into the path to that folder, as a listed folder's do.
function constructFolderNodeConfigs(folderPath: string): ConnectionNodeConfig[] {
    const names = folderPath.split('/').filter((name) => name !== '');
    return names.map((name, index) => ({
        id: `/${names.slice(0, index + 1).join('/')}`,
        label: name,
        description: '',
        icon: null,
        iconDark: null,
        childCount: undefined,
        extension: undefined,
        folderPath: index === 0 ? '' : `/${names.slice(0, index).join('/')}`,
        lastModifiedAt: undefined,
        mimeType: undefined,
        name,
        size: undefined,
        typeId: 'folder'
    }));
}

// The encoding the preview detected, with how sure the detection was. Without a confidence level nothing was detected
// and the preview fell back to UTF-8, so the encoding is marked as assumed.
function constructEncodingText(itemReading: ItemReading): string | undefined {
    if (itemReading.encodingId == null) return;
    const encoding = itemReading.encodingId;
    if (itemReading.encodingConfidenceLevel == null) return t(TEXT, 'detail.encoding.assumed.text', { encoding });
    const confidence = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 }).format(itemReading.encodingConfidenceLevel);
    return t(TEXT, 'detail.encoding.text', { confidence, encoding });
}

// What detection found, from a preview the user has not chosen how to read. A choice of one value leaves the other to
// detection, so each is taken only while it was not chosen.
function recordDetectedValues(itemReading: ItemReading): void {
    if (selectedDataFormatId.value == null) detectedDataFormatId.value = itemReading.dataFormatId;
    if (selectedValueDelimiterId.value == null) detectedValueDelimiterId.value = itemReading.valueDelimiterId;
    if (selectedHasHeaders.value == null) detectedHasHeaders.value = itemReading.hasHeaders;
    if (selectedEncodingId.value != null) return;
    detectedEncodingId.value = itemReading.encodingId;
    detectedEncodingIsAssumed.value = itemReading.encodingConfidenceLevel == null;
}

// One decimal place, with more only for a time too short to show in one, so a quick preview does not read as 0. A time
// under 0.01 seconds reads as under that limit, as a preview percentage does.
function constructDurationText(milliseconds: number): string {
    const secondsFormat = new Intl.NumberFormat(localeId.value, {
        style: 'unit',
        unit: 'second',
        maximumFractionDigits: 1,
        maximumSignificantDigits: 1,
        minimumFractionDigits: 1,
        minimumSignificantDigits: 1,
        roundingPriority: 'morePrecision'
    });
    const seconds = milliseconds / 1000;
    return seconds < 0.01 ? `<${secondsFormat.format(0.01)}` : secondsFormat.format(seconds);
}

// Headers and delimiters only apply to delimited text. There they always show, and a parse that found none says so.
function constructHeadersText({ dataFormatId, hasHeaders }: ItemReading): string | undefined {
    if (dataFormatId !== 'dtv') return;
    if (hasHeaders == null) return t(TEXT, 'detail.notDetected.text');
    return t(TEXT, hasHeaders ? 'hasHeaders.yes.label' : 'hasHeaders.no.label');
}

function constructRecordDelimiterText({ dataFormatId, recordDelimiterId }: ItemReading): string | undefined {
    if (dataFormatId !== 'dtv') return;
    return recordDelimiterId == null ? t(TEXT, 'detail.notDetected.text') : constructRecordDelimiterLabel(recordDelimiterId);
}

function constructValueDelimiterText({ dataFormatId, valueDelimiterId }: ItemReading): string | undefined {
    if (dataFormatId !== 'dtv') return;
    return valueDelimiterId == null ? t(TEXT, 'detail.notDetected.text') : constructValueDelimiterLabel(valueDelimiterId);
}

// A column's Auto names the type detected for it.
function constructColumnTypeOptions(columnId: string): SelectOption[] {
    const detectedColumnType = detectedColumnTypes.value.at(Number(columnId));
    const options: SelectOption[] = CHOOSABLE_COLUMN_TYPES.map((columnType) => ({
        groupLabel: columnType.dataSubtypeId == null ? undefined : constructDataTypeLabel(columnType.dataTypeId),
        id: constructColumnTypeId(columnType),
        label: constructColumnTypeLabel(columnType)
    }));
    return [constructAutoOption(detectedColumnType == null ? undefined : constructColumnTypeLabel(detectedColumnType)), ...options];
}

// A column of numbers can be read with either decimal separator. Auto names the one detected. A derived column holds
// no numbers of its own.
function constructDecimalSeparatorOptions(columnId: string): SelectOption[] {
    const columnConfig = activeItemReading.value?.columnConfigs.at(Number(columnId));
    if (columnConfig?.dataTypeId !== 'numeric' || isDerivedColumn(columnConfig)) return [];
    const detectedDecimalSeparatorId = detectedColumnTypes.value.at(Number(columnId))?.decimalSeparatorId;
    return [
        constructAutoOption(detectedDecimalSeparatorId == null ? undefined : constructDecimalSeparatorLabel(detectedDecimalSeparatorId)),
        { id: '.', label: constructDecimalSeparatorLabel('.') },
        { id: ',', label: constructDecimalSeparatorLabel(',') }
    ];
}

function constructDecimalSeparatorLabel(decimalSeparatorId: DecimalSeparatorId): string {
    return t(TEXT, decimalSeparatorId === ',' ? 'decimalSeparator.comma.label' : 'decimalSeparator.point.label');
}

function constructDecimalSeparatorValue(columnId: string): string {
    return selectedDecimalSeparators.value[columnId] ?? AUTO_OPTION_ID;
}

// Only a text column of the item has the choice. Undefined hides it.
function constructNullWordReading(columnId: string): 'empty' | 'text' | undefined {
    const columnConfig = activeItemReading.value?.columnConfigs.at(Number(columnId));
    if (columnConfig?.dataTypeId !== 'string' || isDerivedColumn(columnConfig)) return undefined;
    return selectedNullWords.value[columnId] === true ? 'empty' : 'text';
}

// The value of a column's type select.
function constructColumnTypeValue(columnId: string): string {
    const selectedColumnType = selectedColumnTypes.value[columnId];
    return selectedColumnType == null ? AUTO_OPTION_ID : constructColumnTypeId(selectedColumnType);
}

// The type a column is read as, named for its menu button, because the icon alone does not say it.
function constructColumnTypeText(columnId: string): string {
    const columnConfig = activeItemReading.value?.columnConfigs.at(Number(columnId));
    return columnConfig == null ? '' : constructColumnTypeLabel(columnConfig);
}

// The icon for a column's type select. Undefined until the preview holds the column.
function constructColumnTypeIcon(columnId: string): Component | undefined {
    const columnConfig = activeItemReading.value?.columnConfigs.at(Number(columnId));
    return columnConfig == null ? undefined : getColumnTypeIcon(columnConfig);
}

function addColumnTypesResetIssue(itemReading: ItemReading): ItemReading {
    const issue: SampleIssue = { id: COLUMN_TYPES_RESET_ISSUE_ID, lineNumber: undefined, message: 'The column types were reset by the new reading.', severityId: 'info' };
    return { ...itemReading, issues: [...(itemReading.issues ?? []), issue] };
}

// Auto, naming what detection found once it is known. A closed select shows only the value, to save room, and its muted
// italics say it is a default. The line after it sets it apart from the values it chooses between.
function constructAutoOption(detectedText?: string, isAssumed = false): SelectOption {
    let label = t(TEXT, 'readOption.auto.label');
    if (detectedText != null) label = t(TEXT, isAssumed ? 'readOption.autoAssumed.label' : 'readOption.autoDetected.label', { value: detectedText });
    return { closedLabel: detectedText, hasSeparatorAfter: true, id: AUTO_OPTION_ID, label };
}

// A file recognised as something other than data, such as a PDF or an image, has no format, so the type the preview
// detected names it instead. A container type names it by the item's extension, so a legacy Excel file reads 'XLS'.
function constructDataFormatText(dataFormatId: DataFormatId): string {
    const fileType = activeItemReading.value?.fileType;
    if (fileType == null || dataFormatId !== 'unknown') return constructDataFormatLabel(dataFormatId);
    const itemExtension = activeConnectionObjectConfig.value?.extension;
    const isNamedByItem = itemExtension != null && itemExtension !== '' && CONTAINER_FILE_TYPE_EXTENSIONS.has(fileType.ext);
    return (isNamedByItem ? itemExtension : fileType.ext).toUpperCase();
}

// The icon beside an option in the format select's open list, and whether it is greyed out, as the toolbar greys out a
// format with no reader yet. Auto shows the format detected.
function constructDataFormatOptionIcon(optionId: string): { iconConfig: DataFormatIconConfig | undefined; isPlanned: boolean } {
    const dataFormatId = optionId === AUTO_OPTION_ID ? detectedDataFormatId.value : (optionId as DataFormatId);
    return dataFormatId == null || !Object.hasOwn(DATA_FORMAT_ICON_CONFIGS, dataFormatId)
        ? { iconConfig: undefined, isPlanned: false }
        : { iconConfig: DATA_FORMAT_ICON_CONFIGS[dataFormatId as Exclude<DataFormatId, 'unknown'>], isPlanned: PLANNED_DATA_FORMAT_IDS.has(dataFormatId) };
}

function findParserToolConfig(parserId: string | undefined): LocalisedConfig<ToolConfig> | undefined {
    return parserToolConfigs.value.find((parserToolConfig) => parserToolConfig.id === parserId);
}

function findStoreConnection(storeConnectorId: string): LocalisedConfig<ConnectionConfig> | undefined {
    return storeConnections.value.find((storeConnection) => storeConnection.id === storeConnectorId);
}

// The delimiter an option in the value delimiter select stands for. Auto stands for the one detected.
function resolveValueDelimiterId(optionId: string): ValueDelimiterId | undefined {
    return optionId === AUTO_OPTION_ID ? detectedValueDelimiterId.value : VALUE_DELIMITER_CONFIGS.find(({ id }) => id === optionId)?.id;
}

// Sorted by label in the current language, because translation changes the order.
function sortOptionsByLabel(options: SelectOption[]): SelectOption[] {
    return options.toSorted((left, right) => left.label.localeCompare(right.label, localeId.value));
}

// Only a format the app can read as data has tables to show, and only when something was parsed without an error.
// Markdown, a format not supported yet and one that never will be all show as text. The table stays enabled while
// there is no preview, so the tabs do not flicker as it loads.
function isPreviewTabDisabled(previewTabId: PreviewTabId): boolean {
    const itemReading = activeItemReading.value;
    return (
        previewTabId === 'table' &&
        itemReading != null &&
        (sampleHasErrorIssue.value || itemReading.parsedRecords.length === 0 || !READABLE_DATA_FORMAT_IDS.has(itemReading.dataFormatId))
    );
}

// The next enabled tab in the direction given, wrapping round at either end.
function stepToEnabledPreviewTabIndex(previewTabIndex: number, step: 1 | -1): number {
    let nextIndex = previewTabIndex;
    do {
        nextIndex = (nextIndex + step + PREVIEW_TABS.length) % PREVIEW_TABS.length;
    } while (isPreviewTabDisabled(assertDefined(PREVIEW_TABS[nextIndex]).id));
    return nextIndex;
}

function createPreviewTabElementId(previewTabId: PreviewTabId): string {
    return `${elementIdPrefix}-${previewTabId}-tab`;
}

// Whether the item is the data view's own, unchanged since, and read the same way, so the data view's audit still applies.
function isSameAsSavedItem(dataViewConfig: DataViewConfig, connectionNodeConfig: ConnectionNodeConfig, readingConfig: ReadingConfig): boolean {
    const savedNodeConfig = dataViewConfig.connectionNodeConfig;
    const savedReadingConfig = dataViewConfig.readingConfig;
    return (
        savedNodeConfig != null &&
        savedReadingConfig != null &&
        constructItemPath(savedNodeConfig) === constructItemPath(connectionNodeConfig) &&
        savedNodeConfig.lastModifiedAt === connectionNodeConfig.lastModifiedAt &&
        savedReadingConfig.dataFormatId === readingConfig.dataFormatId &&
        savedReadingConfig.encodingId === readingConfig.encodingId &&
        savedReadingConfig.parserId === readingConfig.parserId &&
        savedReadingConfig.hasHeaders === readingConfig.hasHeaders &&
        savedReadingConfig.recordDelimiterId === readingConfig.recordDelimiterId &&
        savedReadingConfig.valueDelimiterId === readingConfig.valueDelimiterId
    );
}

function resetPreviewState(): void {
    activeItemReading.value = undefined;
    activeContentAuditConfig.value = undefined;
    previewIsPending.value = false;
    previewTableColumnDefinitions.value = [];
    previewTableDataSource.value = {
        rowCount: 0,
        getRows: (): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: [] })
    };
    text.value = undefined;
}

// A preview detects headers afresh, so the user's choice for this item, or the one saved with it, is put back. Otherwise
// reopening a saved item would change how it reads and lose its audit.
function applyHeaderChoice(itemReading: ItemReading, connectionNodeConfig: ConnectionNodeConfig): ItemReading | Promise<ItemReading> {
    const hasHeaders = findChosenHasHeaders(connectionNodeConfig);
    return hasHeaders == null || itemReading.dataFormatId !== 'dtv' ? itemReading : applyHeaders(itemReading, hasHeaders);
}

// The user's choice of whether the item has a header, or the one saved with it. Undefined while it is still detected.
function findChosenHasHeaders(connectionNodeConfig: ConnectionNodeConfig): boolean | undefined {
    const savedNodeConfig = dataViewConfig.value?.connectionNodeConfig;
    const savedHasHeaders =
        savedNodeConfig != null && constructItemPath(savedNodeConfig) === constructItemPath(connectionNodeConfig) ? dataViewConfig.value?.readingConfig?.hasHeaders : undefined;
    return selectedHasHeaders.value ?? savedHasHeaders;
}

function areHeadersChosen(): boolean {
    const connectionNodeConfig = activeConnectionObjectConfig.value;
    return connectionNodeConfig != null && findChosenHasHeaders(connectionNodeConfig) != null;
}

function applyHeaders(itemReading: ItemReading, hasHeaders: boolean): ItemReading | Promise<ItemReading> {
    const headersAreUnchanged = hasHeaders === itemReading.hasHeaders;
    return headersAreUnchanged ? applyPreviewHeaders(itemReading, hasHeaders) : recountPreviewColumns(itemReading, hasHeaders);
}

// The first record moves between the columns' names and their data, so every count changes. It runs in the engine, which
// does all the counting, and the records already read are enough.
async function recountPreviewColumns(itemReading: ItemReading, hasHeaders: boolean): Promise<ItemReading> {
    if (!activeConnectionConfig.value) return applyPreviewHeaders(itemReading, hasHeaders);
    const { processRequest } = await establishEngineWorker();
    const options: RecountPreviewColumnsOptions = { hasHeaders, parsedRecords: itemReading.parsedRecords };
    const columnConfigs = (await processRequest('recountPreviewColumns', activeConnectionConfig.value, options)) as ObjectColumnConfig[];
    return applyPreviewHeaders({ ...itemReading, columnConfigs }, hasHeaders);
}

// The labels already show the new choice, so the table stays as it is while the counts catch up. The types the user
// chose are kept, because the records have not changed.
async function recountActivePreview(hasHeaders: boolean): Promise<void> {
    const itemReading = activeItemReading.value;
    if (itemReading == null) return;
    const currentRequestId = ++previewRequestId.value;
    try {
        const recountedItemReading = await recountPreviewColumns(itemReading, hasHeaders);
        if (currentRequestId !== previewRequestId.value) return; // A newer choice owns the panel now.
        // The headers changed how the item reads, so an audit no longer describes it.
        activeContentAuditConfig.value = constructPreviewContentAuditConfig(
            recountedItemReading,
            Date.now(),
            recountedItemReading.size === activeConnectionObjectConfig.value?.size
        );
        detectedColumnTypes.value = constructDetectedColumnTypes(recountedItemReading);
        activeItemReading.value = applyChosenColumns(recountedItemReading);
        showPreviewColumns(activeItemReading.value);
    } catch (error) {
        if (currentRequestId !== previewRequestId.value) return; // A newer choice owns the panel now.
        itemFailure.value = raiseFailure(
            new AppError('Failed to recount the preview columns.', 'dpuse-app.SelectItemPanel.recountActivePreview', { typeId: 'handled' }, { cause: error })
        );
    }
}

// A saved audit of this item, read this way, replaces what opening it found, so returning to the step does not lose it.
// Otherwise the columns found on opening stay, each with any type saved for it.
function applySavedAudit(itemReading: ItemReading, connectionNodeConfig: ConnectionNodeConfig): ItemReading {
    const savedConfig = dataViewConfig.value;
    const savedContentAuditConfig = savedConfig?.contentAuditConfig;
    if (savedConfig == null || savedContentAuditConfig == null || !isSameAsSavedItem(savedConfig, connectionNodeConfig, constructReadingConfig(itemReading))) {
        return applyChosenColumns(itemReading);
    }
    activeContentAuditConfig.value = savedContentAuditConfig;
    selectedColumnTypes.value = constructChosenColumnTypes(savedConfig);
    selectedDecimalSeparators.value = constructChosenDecimalSeparators(savedConfig.columnChoiceConfigs);
    selectedNullWords.value = constructChosenNullWords(savedConfig.columnChoiceConfigs);
    return applyAuditColumns(itemReading, savedContentAuditConfig.columns);
}

// Puts an audit's columns on the item, keeping the types and decimal separators the user chose.
function applyAuditColumns(itemReading: ItemReading, columnConfigs: ObjectColumnConfig[]): ItemReading {
    const columnItemReading = applyPreviewHeaders({ ...itemReading, columnConfigs }, itemReading.hasHeaders === true);
    detectedColumnTypes.value = constructDetectedColumnTypes(columnItemReading);
    return applyChosenColumns(columnItemReading);
}

// The types first, because putting a detected type back also puts back the detected decimal separator.
function applyChosenColumns(itemReading: ItemReading): ItemReading {
    const typedItemReading = applyPreviewColumnTypes(itemReading, selectedColumnTypes.value, detectedColumnTypes.value);
    return applyPreviewNullWordChoices(applyPreviewDecimalSeparators(typedItemReading, selectedDecimalSeparators.value, selectedColumnTypes.value), selectedNullWords.value);
}

// Reads up to the preview's limit, the same way the item is read now, and shows the larger records and text. Nothing to do
// once the preview has reached the limit or holds the whole item.
async function readLargerPreview(): Promise<AuditObjectContentResult | undefined> {
    const itemReading = activeItemReading.value;
    const connectionNodeConfig = activeConnectionObjectConfig.value;
    if (itemReading == null || connectionNodeConfig == null || !activeConnectionConfig.value) return;
    const previewSize = itemReading.size ?? 0;
    if (previewSize >= PREVIEW_BYTE_LIMIT || previewSize === connectionNodeConfig.size) return;

    const currentRequestId = ++previewRequestId.value;
    previewIsPending.value = true;
    try {
        const { processRequest } = await establishEngineWorker();
        const options: PreviewObjectOptions = {
            chunkSize: PREVIEW_BYTE_LIMIT,
            dataFormatId: itemReading.dataFormatId,
            encodingId: itemReading.encodingId,
            extension: undefined,
            mimeType: connectionNodeConfig.mimeType,
            parserId: itemReading.parserId,
            path: constructItemPath(connectionNodeConfig),
            valueDelimiterId: itemReading.valueDelimiterId
        };
        const previewObjectResult = (await processRequest('previewObject', activeConnectionConfig.value, options)) as PreviewObjectResult;
        if (currentRequestId !== previewRequestId.value) return;
        // More records can show a header the first preview missed, unless the user chose whether there is one.
        const detectedReading = constructItemReading(previewObjectResult);
        const headersAreFound = itemReading.hasHeaders !== true && !areHeadersChosen() && detectedReading.hasHeaders === true;
        const largerReading = await applyHeaders(detectedReading, itemReading.hasHeaders === true || headersAreFound);
        if (currentRequestId !== previewRequestId.value) return;
        activeItemReading.value = applyPreviewHeaders(
            { ...itemReading, issues: largerReading.issues ?? [], parsedRecords: largerReading.parsedRecords, size: largerReading.size, text: largerReading.text },
            largerReading.hasHeaders === true
        );
        text.value = largerReading.text;
        showPreviewTable(activeItemReading.value);
        return { contentAuditConfig: constructFirstContentAuditConfig(previewObjectResult.contentAuditConfig, largerReading), hasHeaders: largerReading.hasHeaders === true };
    } finally {
        if (currentRequestId === previewRequestId.value) previewIsPending.value = false; // A newer selection owns the busy state now.
    }
}

// What opening an item audited, with its columns named and its records counted the way the headers are now set.
function constructFirstContentAuditConfig(contentAuditConfig: ContentAuditConfig, itemReading: ItemReading): ContentAuditConfig {
    return {
        ...contentAuditConfig,
        columns: itemReading.columnConfigs,
        recordCount: Math.max(0, itemReading.parsedRecords.length - (itemReading.hasHeaders === true ? 1 : 0))
    };
}

function constructAuditDetailGroup(contentAuditConfig: ContentAuditConfig): {
    details: { labelKey: keyof typeof TEXT; value: string | undefined }[];
    id: string;
    title: string;
} {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const formatOptionalCount = (count: number | undefined): string | undefined => (count == null ? undefined : numberFormat.format(count));
    return {
        id: 'audit',
        title: t(TEXT, 'detail.audit.title'),
        details: [
            { labelKey: 'detail.auditedAmount.label', value: auditedAmountText.value },
            { labelKey: 'detail.records.label', value: formatCount(contentAuditConfig.recordCount) },
            { labelKey: 'detail.lines.label', value: formatOptionalCount(contentAuditConfig.lineCount) },
            { labelKey: 'detail.emptyLines.label', value: formatOptionalCount(contentAuditConfig.emptyLineCount) },
            { labelKey: 'detail.commentLines.label', value: formatOptionalCount(contentAuditConfig.commentLineCount) },
            { labelKey: 'detail.unevenRecords.label', value: formatOptionalCount(contentAuditConfig.invalidFieldLengthCount) },
            { labelKey: 'detail.duration.label', value: constructDurationText(contentAuditConfig.duration) },
            {
                labelKey: 'detail.sourceWait.label',
                value: contentAuditConfig.sourceWaitDuration == null ? undefined : constructDurationText(contentAuditConfig.sourceWaitDuration)
            }, // Part of the duration.
            { labelKey: 'detail.audited.label', value: new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeStyle: 'short' }).format(contentAuditConfig.asAt) }
        ]
    };
}

// The types saved with this item. A different item starts with none.
function constructSavedColumnTypes(connectionNodeConfig: ConnectionNodeConfig): ChosenColumnTypes {
    const savedNodeConfig = dataViewConfig.value?.connectionNodeConfig;
    const isSavedItem = savedNodeConfig != null && constructItemPath(savedNodeConfig) === constructItemPath(connectionNodeConfig);
    return isSavedItem ? constructChosenColumnTypes(dataViewConfig.value) : {};
}

// The decimal separators saved with this item. A different item starts with none.
function isSavedItem(connectionNodeConfig: ConnectionNodeConfig): boolean {
    const savedNodeConfig = dataViewConfig.value?.connectionNodeConfig;
    return savedNodeConfig != null && constructItemPath(savedNodeConfig) === constructItemPath(connectionNodeConfig);
}

function constructSavedDecimalSeparators(connectionNodeConfig: ConnectionNodeConfig): ChosenDecimalSeparators {
    const savedNodeConfig = dataViewConfig.value?.connectionNodeConfig;
    const isSavedItem = savedNodeConfig != null && constructItemPath(savedNodeConfig) === constructItemPath(connectionNodeConfig);
    return isSavedItem ? constructChosenDecimalSeparators(dataViewConfig.value?.columnChoiceConfigs) : {};
}

function constructDetectedColumnTypes({ columnConfigs }: ItemReading): DetectedColumnType[] {
    return columnConfigs.map(({ dataSubtypeId, dataTypeId, decimalSeparatorId }) => ({ dataSubtypeId, dataTypeId, decimalSeparatorId }));
}

// A new read choice stays on the current tab, so the user can compare the readings, unless the new reading disables it.
function applyItemReading(itemReading: ItemReading, isNewReadChoice: boolean): void {
    activeItemReading.value = itemReading;
    if (!isNewReadChoice || isPreviewTabDisabled(currentPreviewTabId.value)) currentPreviewTabId.value = establishFirstPreviewTabId(itemReading);
    text.value = itemReading.text;
    showPreviewTable(itemReading);
}

// Every record is at hand, so a column fits its widest value. A number is measured with its decimal padding, and the room
// for the icon is kept for a column with invalid values. The padding comes from the column, not the value's state, because
// the engine reports the states after the table is built. A numeric column has no width limit, because a number cut off
// would lose its decimal point's place in the column.
function constructPreviewColumnWidth(itemReading: ItemReading, label: string, columnIndex: number): number {
    const columnConfig = itemReading.columnConfigs[columnIndex];
    const isNumeric = columnConfig.dataTypeId === 'numeric';
    const columnEnding = isNumeric ? constructColumnEnding(columnConfig.formats) : '';
    const dataOffset = itemReading.hasHeaders === true ? 1 : 0;
    const values = itemReading.parsedRecords.slice(dataOffset).map((record) => {
        const value = record[columnIndex]?.value ?? '';
        if (!isNumeric || value.trim() === '') return value;
        const { hiddenPadding, shownPadding } = constructDecimalPadding(value, columnConfig, columnEnding);
        return `${value}${shownPadding}${hiddenPadding}`;
    });
    const fittedWidth = constructFittedColumnWidth(label, values, {
        cellExtraPx: (columnValueCounts.value[columnIndex]?.invalidCount ?? 0) > 0 ? PREVIEW_INVALID_ICON_WIDTH_PX : 0,
        headerExtraPx: PREVIEW_COLUMN_MARKS_WIDTH_PX + HEADER_TAB_INSET_PX,
        maximumWidthPx: isNumeric ? Infinity : undefined
    });
    return Math.max(fittedWidth, MINIMUM_FITTED_PREVIEW_COLUMN_WIDTH_PX);
}

function showPreviewTable(itemReading: ItemReading): void {
    showPreviewColumns(itemReading);

    const dataOffset = itemReading.hasHeaders === true ? 1 : 0;
    const previewRows = itemReading.parsedRecords
        .slice(dataOffset)
        .map((record) => Object.fromEntries(record.map((cell, index) => [String(index), cell.value])) as Record<string, string | null>);

    previewTableDataSource.value = {
        rowCount: previewRows.length,
        getRows: (start: number, end: number): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: previewRows.slice(start, end) })
    };
}

// Run whenever the columns change with the records staying the same, such as after an audit, because a column's longest
// decimal decides how much room its numbers need. The records stay in place, so the table keeps its scroll position.
// A derived column, such as a currency column, is not in the item's records, so the records table leaves it out. It
// comes after every column of the item, so the others keep their positions.
function showPreviewColumns(itemReading: ItemReading): void {
    const previewColumnLabels = itemReading.columnConfigs.filter((config) => !isDerivedColumn(config)).map((config, index) => config.label.en ?? String(index));

    // Columns are keyed by position, not header text. TanStack reads a dot in an 'accessorKey' as a nested path, and two
    // columns with the same header text would share one key.
    previewTableColumnDefinitions.value = previewColumnLabels.map<ColumnDef<TableFeatureSet, Record<string, string | null>>>((label, index) => ({
        accessorKey: String(index),
        header: label,
        minSize: MINIMUM_PREVIEW_COLUMN_WIDTH_PX,
        size: constructPreviewColumnWidth(itemReading, label, index)
    }));
}

// The tab that shows the item as its format suggests: data as a table, anything else as text. Data with no usable
// table opens on the text, so the user can see why. Every other tab stays available, apart from a disabled table.
function establishFirstPreviewTabId(itemReading: ItemReading): PreviewTabId {
    const requestedColumnIndex = (history.state as { columnIndex?: number } | null)?.columnIndex;
    if (requestedColumnIndex != null) {
        selectedColumnIndex.value = requestedColumnIndex; // Sent here to check this column, whose detail opens over the table.
    }
    const tableIsUsable = itemReading.parsedRecords.length > 0 && (itemReading.issues ?? []).every((issue) => issue.severityId !== 'error');
    return tableIsUsable && TABLE_DATA_FORMAT_IDS.has(itemReading.dataFormatId) ? 'table' : 'text';
}

function constructSampleIssueLineText(issue: SampleIssue): string | undefined {
    if (issue.lineNumber == null) return;
    if (issue.endLineNumber == null) return t(TEXT, 'issue.line.text', { line: formatCount(issue.lineNumber) });
    return t(TEXT, 'issue.lines.text', { end: formatCount(issue.endLineNumber), start: formatCount(issue.lineNumber) });
}

// A value of only spaces or tabs cannot be seen, so it is named instead.
function constructSampleIssueValueName(value: string | undefined): string | undefined {
    if (value?.trim() !== '') return;
    if (value === ' ') return t(TEXT, 'issue.value.space.text');
    if (value === '\t') return t(TEXT, 'issue.value.tab.text');
    return t(TEXT, 'issue.value.whitespace.text');
}

function formatCount(count: number): string {
    return formatNumberAsDecimalNumber(count, 0, 0, localeId.value);
}

function constructChildCountText(childCount: number): string {
    return t(TEXT, childCount === 1 ? 'folder.childCount.one.text' : 'folder.childCount.other.text', { count: formatCount(childCount) });
}

function constructSampleIssueText(issue: SampleIssue): string {
    const textKey = SAMPLE_ISSUE_TEXT_KEYS[issue.id];
    return textKey ? t(TEXT, textKey) : issue.message;
}

// Navigate to a folder. Setting currentFolderPath is all that's needed: connectionNodeConfigsDataSource picks it
// up reactively, producing a new DataSource object that useDataWindow detects and fetches fresh blocks for.
function loadFolderNodes(connectionConfig: LocalisedConfig<ConnectionConfig> | undefined, folderPath: string): void {
    if (connectionConfig == null) return;
    currentFolderPath.value = folderPath;
}

const infoString = ref('');

async function getInfo(connectionNodeConfig: ConnectionNodeConfig): Promise<void> {
    try {
        const activeConnection = await waitForActiveConnectionConfig();
        const { processRequest } = await establishEngineWorker();
        const options: GetInfoOptions = { path: constructItemPath(connectionNodeConfig) };
        const { info } = (await processRequest('getInfo', activeConnection, options)) as GetInfoResult;
        const infoWithoutChildren = { ...info };
        delete infoWithoutChildren.children;
        infoString.value = JSON.stringify(infoWithoutChildren);
        console.log(infoWithoutChildren);
    } catch (error) {
        const data = { typeId: 'handled' };
        itemFailure.value = raiseFailure(new AppError('Failed to read this item.', 'dpuse-app.SelectItemPanel.getInfo', data, { cause: error }));
    }
}
</script>

<template>
    <ErrorNotice v-if="listFailure" :failures="[listFailure]" @retry="handleRetryList" />

    <GridDetailPanel v-else ref="gridDetailPanel" :selected-item="activeConnectionObjectConfig" :data-source="connectionNodeConfigsDataSource" :is-compact="true" max-grid-width="320px">
        <!-- Explore ─ In the header slot because it is always rendered. It stays in the pill, dimmed until an item that
             is data has previewed and its audit has finished, because it is the step's way on. -->
        <template #header>
            <Teleport defer :to="`#${DATA_VIEW_STEP_ACTION_ID}`">
                <PillSegment
                    :disabled="itemFailure != null || !previewIsSelectable || auditIsRunning"
                    :disabled-reason="exploreDisabledReason"
                    :icon="ArrowRightIcon"
                    is-step-action
                    :label="t(TEXT, 'explore.label')"
                    @click="handleMoveToExploreStep"
                />
            </Teleport>
        </template>

        <template #item="{ item }">
            <!-- <ConfigCard v-if="item" :actions="[{ typeId: 'info', onClick: () => getInfo(item) }]" :config="item" :is-compact="true" @click="handleSelectConnectionNode(item)" /> -->
            <!-- The icon and the overline tell a folder, which opens, from an item, which is picked. The overline is not shown
                 on a compact row, but it is read out before the name, so screen readers hear which one it is too. -->
            <ConfigCard
                v-if="item"
                :config="item"
                :fallback-icon="item.typeId === 'folder' ? FolderIcon : itemTypeIcon"
                :is-compact="true"
                :overline="t(TEXT, item.typeId === 'folder' ? 'folder.label' : `${itemSubject}.label`)"
                :selected="item.id === activeConnectionObjectConfig?.id"
                @click="handleSelectConnectionNode(item)"
            >
                <!-- Child Count ─ Only the number on screen, because a folder holds nothing but items. Screen readers hear
                     the whole phrase, so the number is not read out alone. -->
                <template v-if="item.typeId === 'folder' && item.childCount != null" #note>
                    <span aria-hidden="true">{{ formatCount(item.childCount) }}</span>
                    <span class="sr-only">{{ constructChildCountText(item.childCount) }}</span>
                </template>
            </ConfigCard>
        </template>

        <template #detail="{ item }">
            <ErrorNotice v-if="itemFailure" :failures="[itemFailure]" @retry="handleRetryItem" />
            <!-- Preview Toolbar ─ One row over the preview only, so the breadcrumbs keep the whole header row. -->
            <div v-if="itemFailure == null" ref="previewToolbar" class="relative flex h-10 flex-none items-center gap-x-2 border-b border-separator px-page text-xs text-muted">
                <!-- Read Choices ─ How the item is read and where it loads. A value truncates as the row narrows, but
                     only to 'min-w-22', a few letters, because less says nothing. Past that the toolbar's next stage
                     hides the values, and in the last the selects fold into a popover below one button. 'Teleport'
                     moves the same selects there, so they keep their state. -->
                <ActionWrapper
                    v-if="previewFormatText && readChoicesAreFolded"
                    :aria-label="t(TEXT, 'readChoices.aria', { label: item.label })"
                    class="-ml-1.5 flex h-7 flex-none items-center gap-x-0.5 rounded-md px-1.5 hover:state-hover active:state-press"
                    :popovertarget="readChoicesPopoverId"
                    :title="t(TEXT, 'readChoices.aria', { label: item.label })"
                >
                    <SlidersHorizontalIcon aria-hidden="true" class="size-[1.25em] flex-none" />
                    <ChevronDownIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
                </ActionWrapper>
                <Teleport v-if="previewFormatText" defer :disabled="!readChoicesAreFolded" :to="`#${readChoicesPopoverId}`">
                    <!-- In the row the wrapper takes no box of its own ('contents'), so each select is one of the toolbar's
                         own items, and the toolbar overflows, and moves to its next stage, once they can shrink no more. -->
                    <div :class="readChoicesAreFolded ? 'flex flex-col items-start gap-y-1' : 'contents'">
                        <!-- Format, Encoding, Parser and Value Delimiter ─ Choosing any of them reads the item again
                             that way. A binary file has no encoding to choose, the parser is offered only when more
                             than one reads the format, and only delimited text has a value delimiter. -->
                        <!-- '-ml-1.75' cancels the select's own padding and border, so its icon lines up with the page
                             edge. Only in the row, because in the folded popover it would put this icon out of line with
                             the icons below it. -->
                        <SelectInput
                            v-if="previewFormatText"
                            v-model="previewDataFormatId"
                            :is-default="selectedDataFormatId == null"
                            :class="[readChoiceSelectClass, { '-ml-1.75': !readChoicesAreFolded }]"
                            :description="previewFormatSupport ? t(TEXT, previewFormatSupport.ariaKey) : undefined"
                            :disabled="readChoicesAreLocked"
                            is-compact
                            :is-value-hidden="readChoiceValuesAreHidden"
                            :label="t(TEXT, 'format.label')"
                            label-hidden
                            :options="dataFormatOptions"
                            :tone="selectedDataFormatId == null ? undefined : 'info'"
                        >
                            <!-- One icon: the format's own for a format the app can read or plans to, greyed out while
                                 it has no reader, and otherwise why it cannot be read. -->
                            <template #icon>
                                <ConfigIcon
                                    v-if="(previewFormatSupport?.id === 'supported' || previewFormatSupport?.id === 'planned') && previewFormatIconConfig"
                                    class="size-[1.25em] flex-none"
                                    :class="{ 'opacity-60 grayscale': previewFormatSupport.id === 'planned' }"
                                    :icon="previewFormatIconConfig.icon"
                                    :icon-dark="previewFormatIconConfig.iconDark"
                                />
                                <component
                                    :is="previewFormatSupport.icon"
                                    v-else-if="previewFormatSupport?.icon && previewFormatSupport.id !== 'supported'"
                                    aria-hidden="true"
                                    class="size-[1.25em] flex-none"
                                    :class="previewFormatSupport.colorClass"
                                    :stroke-width="2.5"
                                />
                            </template>
                            <!-- Each format's icon in the open list, 1.25 times its text as the closed select's is. The box keeps
                                 its size when there is no icon, so every label lines up. -->
                            <template #option-icon="{ option }">
                                <span class="flex size-[1.25em] flex-none">
                                    <ConfigIcon
                                        class="size-full"
                                        :class="{ 'opacity-60 grayscale': constructDataFormatOptionIcon(option.id).isPlanned }"
                                        :icon="constructDataFormatOptionIcon(option.id).iconConfig?.icon"
                                        :icon-dark="constructDataFormatOptionIcon(option.id).iconConfig?.iconDark"
                                    />
                                </span>
                            </template>
                        </SelectInput>
                        <SelectInput
                            v-if="activeItemReading?.encodingId != null"
                            v-model="previewEncodingId"
                            :is-default="selectedEncodingId == null"
                            :class="readChoiceSelectClass"
                            :disabled="readChoicesAreLocked"
                            is-compact
                            :is-value-hidden="readChoiceValuesAreHidden"
                            :label="t(TEXT, 'encoding.label')"
                            label-hidden
                            :options="encodingOptions"
                            :tone="encodingSelectTone"
                        >
                            <template #icon><LanguagesIcon aria-hidden="true" class="size-[1.25em] flex-none text-muted" /></template>
                        </SelectInput>
                        <SelectInput
                            v-if="parserIsChoosable"
                            v-model="previewParserId"
                            :class="readChoiceSelectClass"
                            :disabled="readChoicesAreLocked"
                            is-compact
                            :is-value-hidden="readChoiceValuesAreHidden"
                            :label="t(TEXT, 'parser.label')"
                            label-hidden
                            :options="parserOptions"
                        >
                            <!-- Each parser shows its tool's own icon, closed and in the open list. A tool without one falls back
                                 to a generic icon when closed. -->
                            <template #icon>
                                <ConfigIcon
                                    v-if="findParserToolConfig(previewParserId)?.icon ?? findParserToolConfig(previewParserId)?.iconDark"
                                    class="size-[1.25em] flex-none"
                                    :icon="findParserToolConfig(previewParserId)?.icon"
                                    :icon-dark="findParserToolConfig(previewParserId)?.iconDark"
                                />
                                <ScanTextIcon v-else aria-hidden="true" class="size-[1.25em] flex-none text-muted" />
                            </template>
                            <template #option-icon="{ option }">
                                <span class="flex size-[1.25em] flex-none">
                                    <ConfigIcon class="size-full" :icon="findParserToolConfig(option.id)?.icon" :icon-dark="findParserToolConfig(option.id)?.iconDark" />
                                </span>
                            </template>
                        </SelectInput>
                        <SelectInput
                            v-if="valueDelimiterIsChoosable"
                            v-model="previewValueDelimiterId"
                            :is-default="selectedValueDelimiterId == null"
                            :class="readChoiceSelectClass"
                            :disabled="readChoicesAreLocked"
                            is-compact
                            :is-value-hidden="readChoiceValuesAreHidden"
                            :label="t(TEXT, 'valueDelimiter.label')"
                            label-hidden
                            :options="valueDelimiterOptions"
                            :tone="selectedValueDelimiterId == null ? undefined : 'info'"
                        >
                            <template #icon><SeparatorVerticalIcon aria-hidden="true" class="size-[1.25em] flex-none text-muted" /></template>
                            <template #option-icon="{ option }"><ValueDelimiterIcon :value-delimiter-id="resolveValueDelimiterId(option.id)" /></template>
                        </SelectInput>
                        <!-- Headers ─ Changes how the records already read are shown and counted, so the item is not
                             read again. The icon shows the value too, because a narrow toolbar hides the value: a filled
                             top row for headers, an empty one for none. -->
                        <SelectInput
                            v-if="previewHeadersAreChoosable"
                            v-model="previewHeadersId"
                            :class="readChoiceSelectClass"
                            :disabled="readChoicesAreLocked"
                            is-compact
                            :is-value-hidden="readChoiceValuesAreHidden"
                            :is-default="selectedHasHeaders == null"
                            :label="t(TEXT, 'hasHeaders.label')"
                            label-hidden
                            :options="headersOptions"
                            :tone="selectedHasHeaders == null ? undefined : 'info'"
                        >
                            <template #icon>
                                <HeadersIcon class="size-[1.25em] flex-none text-muted" :has-headers="previewHasHeaders" />
                            </template>
                        </SelectInput>
                        <!-- Store ─ Last, because it is where the records go once they are read. -->
                        <SelectInput
                            v-if="storeIsChoosable"
                            v-model="storeConnectorId"
                            :class="readChoiceSelectClass"
                            :disabled="readChoicesAreLocked"
                            is-compact
                            :is-value-hidden="readChoiceValuesAreHidden"
                            :label="t(TEXT, 'store.label')"
                            label-hidden
                            :options="storeOptions"
                        >
                            <!-- Each store shows its connector's own icon, closed and in the open list, as the parser does. A
                                 connector without one falls back to a generic icon when closed. -->
                            <template #icon>
                                <ConfigIcon
                                    v-if="findStoreConnection(storeConnectorId)?.icon ?? findStoreConnection(storeConnectorId)?.iconDark"
                                    class="size-[1.25em] flex-none"
                                    :icon="findStoreConnection(storeConnectorId)?.icon"
                                    :icon-dark="findStoreConnection(storeConnectorId)?.iconDark"
                                />
                                <DatabaseIcon v-else aria-hidden="true" class="size-[1.25em] flex-none text-muted" />
                            </template>
                            <template #option-icon="{ option }">
                                <span class="flex size-[1.25em] flex-none">
                                    <ConfigIcon class="size-full" :icon="findStoreConnection(option.id)?.icon" :icon-dark="findStoreConnection(option.id)?.iconDark" />
                                </span>
                            </template>
                        </SelectInput>
                        <!-- Audit ─ After the read choices, as it reads the item the way they set. Audits again for a
                             whole item, or offers a choice of sizes for part of one, and Stop replaces it while an
                             audit runs. It truncates and folds with the selects. The amount audited shows in the status
                             bar, because a button there would sit where a phone's own swipes start. -->
                        <template v-if="auditIsRunning || (auditStatus && auditActionIsShown)">
                            <ActionWrapper
                                v-if="auditIsRunning"
                                class="flex h-7 max-w-full min-w-0 items-center gap-x-1 rounded-md px-1.5 text-sm text-content hover:state-hover active:state-press"
                                :class="readChoiceSelectClass"
                                :title="readChoiceValuesAreHidden ? t(TEXT, 'audit.stop.label') : undefined"
                                @click="stopAudit"
                            >
                                <CircleStopIcon aria-hidden="true" class="size-[1.25em] flex-none text-muted" :stroke-width="1.5" />
                                <span class="min-w-0 truncate" :class="{ 'sr-only': readChoiceValuesAreHidden }">{{ t(TEXT, 'audit.stop.label') }}</span>
                            </ActionWrapper>
                            <ActionWrapper
                                v-else-if="auditStatus?.isComplete"
                                class="flex h-7 max-w-full min-w-0 items-center gap-x-1 rounded-md px-1.5 text-sm text-content hover:state-hover active:state-press disabled:opacity-50"
                                :class="readChoiceSelectClass"
                                :disabled="readChoicesAreLocked"
                                :title="readChoiceValuesAreHidden ? t(TEXT, 'audit.again.label') : undefined"
                                @click="handleStartAudit(undefined)"
                            >
                                <RotateCwIcon aria-hidden="true" class="size-[1.25em] flex-none text-muted" :stroke-width="1.5" />
                                <span class="min-w-0 truncate" :class="{ 'sr-only': readChoiceValuesAreHidden }">{{ t(TEXT, 'audit.again.label') }}</span>
                            </ActionWrapper>
                            <AuditMenu
                                v-else
                                :audit-choices="auditChoices"
                                :class="readChoiceSelectClass"
                                :disabled="readChoicesAreLocked"
                                :is-label-hidden="readChoiceValuesAreHidden"
                                @select="handleStartAudit"
                            >
                                <RotateCwIcon aria-hidden="true" class="size-[1.25em] flex-none text-muted" :stroke-width="1.5" />
                            </AuditMenu>
                        </template>
                    </div>
                </Teleport>
                <!-- Folded Read Choices ─ In the top layer, so the preview cannot cover them. The browser closes them on
                     Escape or a click outside. -->
                <div
                    :id="readChoicesPopoverId"
                    ref="readChoicesPopover"
                    :aria-label="t(TEXT, 'readChoices.aria', { label: item.label })"
                    class="inset-auto m-0 overflow-y-auto menu-panel p-2 text-xs text-muted"
                    popover="auto"
                    role="group"
                    :style="readChoicesPopoverPosition"
                    @beforetoggle="handlePlaceReadChoices"
                />
                <span class="flex-1" />

                <!-- Column Search ─ Opens over the whole toolbar, because the row has no room for both. -->
                <ColumnSearch v-if="columnSearchIsShown" :options="columnSearchOptions" @select="handleSelectColumn" />

                <!-- Preview Tabs ─ Icons rather than words, to leave the toolbar room. '-mr-1.5' centres the last icon 30px
                     from the edge, under the assistant toggle. -->
                <div
                    v-if="!previewTabsAreFolded"
                    :aria-label="t(TEXT, 'previewTabs.aria', { label: item.label })"
                    class="-mr-1.5 flex flex-none items-center gap-x-1 self-stretch"
                    role="tablist"
                >
                    <ActionWrapper
                        v-for="(previewTab, previewTabIndex) in PREVIEW_TABS"
                        :id="createPreviewTabElementId(previewTab.id)"
                        :key="previewTab.id"
                        :aria-controls="`${elementIdPrefix}-panel`"
                        :aria-label="t(TEXT, previewTab.labelKey)"
                        :aria-selected="previewTab.id === currentPreviewTabId"
                        class="flex h-full items-center border-y-2 border-t-transparent px-1.5 enabled:hover:state-hover enabled:active:state-press"
                        :class="previewTab.id === currentPreviewTabId ? 'border-b-content text-emphasis' : 'border-b-transparent text-muted'"
                        :disabled="isPreviewTabDisabled(previewTab.id)"
                        role="tab"
                        :tabindex="previewTab.id === currentPreviewTabId ? 0 : -1"
                        :title="t(TEXT, previewTab.labelKey)"
                        @click="currentPreviewTabId = previewTab.id"
                        @keydown="handleNavigatePreviewTabs($event, previewTabIndex)"
                    >
                        <component :is="previewTab.icon" aria-hidden="true" class="size-5" :stroke-width="1.5" />
                    </ActionWrapper>
                </div>

                <!-- Preview Tab Menu ─ The tabs in a narrow toolbar, showing only the current view's icon, so the toolbar
                     keeps room for the rest. '-mr-3' centres the button 30px from the edge, under the assistant toggle. -->
                <Menu.Root v-else class="-mr-3 flex-none">
                    <template #trigger="{ triggerAttributes }">
                        <ActionWrapper
                            v-bind="triggerAttributes"
                            :aria-label="t(TEXT, 'previewTabMenu.aria', { label: item.label, view: t(TEXT, currentPreviewTab.labelKey) })"
                            class="flex h-7 items-center gap-x-0.5 rounded-md px-1 text-accent hover:state-hover active:state-press"
                            :title="t(TEXT, currentPreviewTab.labelKey)"
                        >
                            <component :is="currentPreviewTab.icon" aria-hidden="true" class="size-5" :stroke-width="1.5" />
                            <ChevronDownIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
                        </ActionWrapper>
                    </template>
                    <Menu.Content class="min-w-40" :label="t(TEXT, 'previewTabs.aria', { label: item.label })" placement="bottom-end">
                        <Menu.Item
                            v-for="previewTab in PREVIEW_TABS"
                            :key="previewTab.id"
                            :is-checked="previewTab.id === currentPreviewTabId"
                            :is-disabled="isPreviewTabDisabled(previewTab.id)"
                            kind="radio"
                            @select="handleSelectPreviewTab(previewTab.id)"
                        >
                            <template #icon><component :is="previewTab.icon" aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" /></template>
                            {{ t(TEXT, previewTab.labelKey) }}
                        </Menu.Item>
                    </Menu.Content>
                </Menu.Root>
            </div>
            <!-- Preview Issues ─ Between the toolbar and the tabs, so they show on every tab without hiding the text or details.
                 A long list scrolls rather than pushing the preview out of view. -->
            <div
                v-if="itemFailure == null && sampleIssueItems.length > 0"
                class="max-h-32 flex-none overflow-y-auto border-b border-separator px-page py-2 text-sm"
                :class="sampleIssueBandClass"
                role="status"
            >
                <ul :aria-label="t(TEXT, 'issues.aria')" class="flex flex-col gap-y-1">
                    <li v-for="issueItem in sampleIssueItems" :key="issueItem.key" class="flex items-start gap-x-2">
                        <component :is="issueItem.icon" aria-hidden="true" class="mt-0.5 size-4 flex-none" :class="issueItem.colorClass" :stroke-width="2" />
                        <!-- Where it is, then what it is, then the value at fault. The lines link to the text, except in markdown,
                             which shows rendered rather than as lines. -->
                        <span class="min-w-0 wrap-break-word">
                            <ActionWrapper
                                v-if="issueItem.lineNumber != null && !previewIsMarkdown"
                                class="mr-2 text-accent hover:underline"
                                @click="handleShowIssueLine(issueItem.lineNumber)"
                                >{{ issueItem.lineText }}</ActionWrapper
                            ><span v-else-if="issueItem.lineText" class="mr-2 text-muted">{{ issueItem.lineText }}</span
                            ><span v-if="issueItem.recordText" class="mr-2 text-muted">{{ issueItem.recordText }}</span
                            ><span v-if="issueItem.fieldText" class="mr-2 text-muted">{{ issueItem.fieldText }}</span
                            >{{ issueItem.text }}
                            <span v-if="issueItem.valueName" class="ml-1 italic">{{ issueItem.valueName }}</span>
                            <code v-else-if="issueItem.value != null" class="ml-1 rounded-sm bg-surface px-1 font-mono text-xs whitespace-pre-wrap">{{ issueItem.value }}</code>
                        </span>
                    </li>
                </ul>
            </div>
            <!-- A tab panel only while the tabs show, because in a narrow toolbar they are a menu instead. -->
            <div
                v-if="itemFailure == null"
                :id="`${elementIdPrefix}-panel`"
                :aria-busy="previewIsPending"
                :aria-labelledby="previewTabsAreFolded ? undefined : createPreviewTabElementId(currentPreviewTabId)"
                class="relative flex min-h-0 flex-1 flex-col"
                :role="previewTabsAreFolded ? undefined : 'tabpanel'"
            >
                <!-- Busy Bar ─ Over the content, because taking up height would nudge the preview down on every read. -->
                <BusyBar v-if="previewIsPending" class="absolute inset-x-0 top-0 z-10 mx-page" />
                <!-- Table ─ A column's detail opens down over the rows and leaves the header in view, so the column names stay
                     on screen to choose another, as the names do beside the detail in the Columns tab. -->
                <div v-show="currentPreviewTabId === 'table' && activeItemReading != null" class="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                    <Table
                        ref="previewTable"
                        class="flex-1"
                        :column-definitions="previewTableColumnDefinitions"
                        :construct-cell-class="constructValueCellClass"
                        :construct-cell-title="constructValueCellTitle"
                        :data-source="previewTableDataSource"
                        is-column-menu-hidden
                        is-column-picker-hidden
                        is-header-tabbed
                        :scroll-area-padding-bottom="PREVIEW_SCROLL_PADDING_BOTTOM"
                        :selected-column-id="selectedColumnIndex == null ? undefined : String(selectedColumnIndex)"
                    >
                        <!-- Column Name ─ Opens the column's detail over the rows, or closes it on the selected tab. The
                         button's overlay covers the whole tab, so a click anywhere on it does the same, while the name
                         stays the button's accessible name. -->
                        <template #header-label="{ columnId }">
                            <ActionWrapper
                                :aria-current="Number(columnId) === selectedColumnIndex ? 'true' : undefined"
                                class="min-w-0 flex-1 truncate text-left text-sm font-medium after:absolute after:inset-0"
                                :class="Number(columnId) === selectedColumnIndex ? 'text-emphasis' : 'text-muted'"
                                :title="
                                    t(TEXT, Number(columnId) === selectedColumnIndex ? 'columnDetail.close.label' : 'columnDetail.label', {
                                        label: String(previewTableColumnDefinitions[Number(columnId)]?.header)
                                    })
                                "
                                @click="handleToggleColumnDetail(Number(columnId))"
                                >{{ previewTableColumnDefinitions[Number(columnId)]?.header }}</ActionWrapper
                            >
                        </template>
                        <!-- Mandatory and Key ─ Only after a whole audit, because the rest of the item could still lack or repeat a
                         value. A key is always mandatory, so 'isRequiredColumn' covers both. The value bar is placed on the
                         header cell, along its bottom edge, so it sits here only to be in the cell. -->
                        <template #header-label-end="{ columnId }">
                            <span v-if="isRequiredColumn(columnId)" class="ml-1 flex flex-none items-center gap-x-0.5 text-muted">
                                <span :aria-label="t(TEXT, 'columnRequired.aria')" role="img" :title="t(TEXT, 'columnRequired.aria')">
                                    <AsteriskIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
                                </span>
                                <span v-if="isKeyColumn(columnId)" :aria-label="t(TEXT, 'columnKey.aria')" role="img" :title="t(TEXT, 'columnKey.aria')">
                                    <KeyRoundIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
                                </span>
                            </span>
                            <ColumnValueBar
                                v-if="columnValueCounts[Number(columnId)]"
                                :column-label="String(previewTableColumnDefinitions[Number(columnId)]?.header)"
                                :column-value-counts="columnValueCounts[Number(columnId)]!"
                                :is-emphasised="selectedColumnIndex == null || Number(columnId) === selectedColumnIndex"
                                @click="handleToggleColumnDetail(Number(columnId))"
                            />
                            <!-- Type Icon ─ Shows the column's type after its name. The type is chosen in the column's
                             detail, so a click on the icon opens the detail like the rest of the tab. The dot marks a
                             type the user chose. 'pointer-events-none' lets a click through to the tab, because the
                             dot's positioning would otherwise lift the icon above the tab's overlay. -->
                            <span
                                :aria-label="constructColumnTypeText(columnId)"
                                class="pointer-events-none relative ml-1.5 flex flex-none items-center text-sm text-muted"
                                role="img"
                            >
                                <component :is="constructColumnTypeIcon(columnId)" aria-hidden="true" class="size-[1.25em] flex-none" />
                                <span v-if="selectedColumnTypes[columnId] != null" aria-hidden="true" class="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-muted" />
                            </span>
                        </template>
                        <!-- Value Marks ─ A shape as well as the tint, so an invalid value does not rely on colour. It goes at the far
                         end of the cell from the value, so the value never moves. Blank and missing values have nothing to
                         show, so a mark in the middle of the tint says they are empty rather than not loaded: '""' for blank
                         and a dash for missing, so they differ by shape as well as colour. -->
                        <template #cell-icon="{ columnId, rowIndex }">
                            <template v-if="constructValueState(columnId, rowIndex) === 'invalid'">
                                <TriangleAlertIcon
                                    aria-hidden="true"
                                    class="size-3.5 flex-none text-danger-text"
                                    :class="isNumericColumn(columnId) ? 'mr-auto' : 'order-1 ml-auto'"
                                    :stroke-width="1.5"
                                />
                                <span class="sr-only">{{ t(TEXT, 'value.invalid.aria') }}</span>
                            </template>
                            <span v-else-if="isValueEmpty(columnId, rowIndex)" class="absolute inset-0 flex items-center justify-center text-sm text-subtle">
                                <span aria-hidden="true">{{ constructValueState(columnId, rowIndex) === 'blank' ? '""' : '–' }}</span>
                                <span class="sr-only">{{ t(TEXT, constructValueState(columnId, rowIndex) === 'blank' ? 'value.blank.aria' : 'value.missing.aria') }}</span>
                            </span>
                        </template>
                        <!-- Decimal Padding ─ A number's missing separator and zeros show in a light colour straight after its last
                         digit, before any ending such as the ')' of '(3.2)', so the decimals line up and read as implied
                         rather than written. The room for a missing ending such as '%' stays 'invisible'. Both are hidden
                         from screen readers, so the value reads as written. A cell that renders nothing shows its plain
                         value. -->
                        <template #cell-value="{ columnId, rowIndex }">
                            <span v-if="constructValueDecimalPadding(columnId, rowIndex)" class="truncate text-sm text-emphasis dark:text-zinc-300"
                                >{{ constructValueDecimalPadding(columnId, rowIndex)?.numberText
                                }}<span aria-hidden="true" class="text-subtle">{{ constructValueDecimalPadding(columnId, rowIndex)?.shownPadding }}</span
                                >{{ constructValueDecimalPadding(columnId, rowIndex)?.writtenEnding
                                }}<span aria-hidden="true" class="invisible">{{ constructValueDecimalPadding(columnId, rowIndex)?.hiddenPadding }}</span></span
                            >
                        </template>
                    </Table>
                    <!-- Column Detail ─ Slides down from under the header. The box below the header clips it, so it never passes
                     over the header. The box lets clicks through to the rows when the detail is closed. -->
                    <div class="pointer-events-none absolute inset-x-0 top-10 bottom-0 z-10 overflow-hidden">
                        <Transition name="dpuse-slide-down">
                            <ColumnDetailPanel
                                v-if="selectedColumnIndex != null && activeItemReading != null"
                                class="pointer-events-auto absolute inset-0 bg-surface shadow-md"
                                :column-index="selectedColumnIndex"
                                :decimal-separator-options="constructDecimalSeparatorOptions(String(selectedColumnIndex))"
                                :decimal-separator-value="constructDecimalSeparatorValue(String(selectedColumnIndex))"
                                :detected-column-type="detectedColumnTypes[selectedColumnIndex]"
                                :has-next-column="selectedColumnStepIndex != null && selectedColumnStepIndex < tableColumnIndexes.length - 1"
                                :has-previous-column="selectedColumnStepIndex != null && selectedColumnStepIndex > 0"
                                :is-type-disabled="readChoicesAreLocked || isDerivedColumn(activeItemReading.columnConfigs[selectedColumnIndex]!)"
                                :item-reading="activeItemReading"
                                :null-word-reading="constructNullWordReading(String(selectedColumnIndex))"
                                :type-options="constructColumnTypeOptions(String(selectedColumnIndex))"
                                :type-value="constructColumnTypeValue(String(selectedColumnIndex))"
                                @close="selectedColumnIndex = undefined"
                                @step="handleStepColumn"
                                @update:decimal-separator-value="handleSelectDecimalSeparator(String(selectedColumnIndex), $event)"
                                @update:null-words-are-empty="handleSelectNullWords(String(selectedColumnIndex), $event)"
                                @update:type-value="handleSelectColumnType(String(selectedColumnIndex), $event)"
                            />
                        </Transition>
                    </div>
                </div>
                <TextViewer
                    v-show="currentPreviewTabId === 'text' && activeItemReading != null && !previewIsMarkdown"
                    ref="textViewer"
                    class="flex-1"
                    :line-highlights="previewLineHighlights"
                    :scroll-area-padding-bottom="PREVIEW_SCROLL_PADDING_BOTTOM"
                    :text="text"
                />
                <!-- Markdown ─ Rendered only while shown, as rendering parses the whole preview. 'renderMarkdown' sanitises
                     the HTML, which comes from the file itself. -->
                <ScrollArea v-if="currentPreviewTabId === 'text' && previewIsMarkdown" class="flex-1" :scroll-area-padding-bottom="PREVIEW_SCROLL_PADDING_BOTTOM">
                    <div class="dpuse-prose px-page py-3 text-sm" v-html="renderMarkdown(text ?? '')" />
                </ScrollArea>
                <ScrollArea
                    v-show="currentPreviewTabId === 'details' && activeItemReading != null"
                    class="flex-1"
                    :scroll-area-padding-bottom="PREVIEW_SCROLL_PADDING_BOTTOM"
                    scroll-area-padding-left="var(--spacing-page)"
                    @initialised="documentScrollElement = $event"
                >
                    <!-- Details Document ─ Laid out as the data view document's lists are, with a line under every row except
                         the last in a section. Read-only, because the toolbar changes how the item is read. -->
                    <StudioDocumentPanel :title="t(TEXT, 'detail.title')" @close="handleReturnToList">
                        <!-- Source ─ Names the connection and the item, so the document stands alone. -->
                        <DataViewSource
                            class="mt-1 mb-4 text-sm"
                            :connection-id="dataViewConfig?.connectionId"
                            :connection-node-config="activeConnectionObjectConfig"
                            :data-format-id="activeItemReading?.dataFormatId"
                            :data-view-connection="activeDataViewConnection"
                            :item-type-id="activeDataViewConnection?.itemTypeId"
                        />
                        <p v-if="previewIsUnsupported" role="status">{{ previewUnsupportedText }}</p>
                        <StudioDocumentSection v-for="detailGroup in itemDetailGroups" :key="detailGroup.id" :title="detailGroup.title">
                            <dl
                                class="grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4"
                            >
                                <template v-for="detail in detailGroup.details" :key="detail.labelKey">
                                    <dt class="text-muted">{{ t(TEXT, detail.labelKey) }}</dt>
                                    <dd class="m-0 min-w-0 wrap-break-word">{{ detail.value }}</dd>
                                </template>
                            </dl>
                        </StudioDocumentSection>
                        <StudioDocumentSection v-if="activeItemReading && activeItemReading.columnConfigs.length > 0" :title="t(TEXT, 'detail.columns.title')">
                            <PreviewColumnTable :item-reading="activeItemReading" />
                        </StudioDocumentSection>
                    </StudioDocumentPanel>
                </ScrollArea>
                <!-- Scroll End Buttons ─ At the start of the data view's pill. Only while this detail is on screen, because
                     on a narrow screen the list can cover it. -->
                <Teleport defer :to="`#${DATA_VIEW_SCROLL_ACTIONS_ID}`">
                    <Transition name="dpuse-pill-segment">
                        <ScrollEndButtons
                            v-if="currentPreviewTabId === 'details' && gridDetailPanelComponent?.detailPaneIsVisible === true"
                            is-in-pill
                            :scroll-element="documentScrollElement"
                        />
                    </Transition>
                </Teleport>
            </div>
            <!-- Status Bar ─ In the safe area along the bottom of a device that has one, and 24px high in the page
                 where there is none, so a sideways scroll bar always sits above the safe area. It only shows what is
                 read, never a button, because a phone's own swipes start at its bottom edge. The running figures change
                 too often to read out, so only the audit bar announces them. The audit is on the left and the preview's
                 extent on the right, as the state and the figures are on the explore step. -->
            <div
                v-if="itemFailure == null"
                class="relative flex h-(--status-bar-height) w-full flex-none items-center justify-between gap-x-4 overflow-hidden border-t border-separator bg-card px-page pt-0.75 text-xs text-muted"
            >
                <!-- Audit Bar ─ Along the status bar's top edge, beside the audit status it measures. Only when the
                     item's size is known. Green when the whole item was audited, the same green as valid values in the
                     column headers' value bars, and blue in the same strength for part of it. The grey track shows how
                     much was not. Any amount keeps a minimum width, so a sliver of a large item is still visible rather
                     than looking like nothing. A progress bar while an audit runs, and otherwise a meter, because it
                     then shows a settled amount. -->
                <div
                    v-if="auditStatus?.percentage != null"
                    :aria-label="t(TEXT, 'audit.aria')"
                    aria-valuemax="100"
                    aria-valuemin="0"
                    :aria-valuenow="Math.round(auditStatus.percentage)"
                    :aria-valuetext="auditStatus.text"
                    class="absolute inset-x-0 top-0 h-0.75 bg-separator/50"
                    :role="auditIsRunning ? 'progressbar' : 'meter'"
                >
                    <div
                        class="h-full"
                        :class="[
                            auditStatus.isComplete
                                ? 'bg-[color-mix(in_srgb,var(--color-success-text)_40%,var(--color-card))]'
                                : 'bg-[color-mix(in_srgb,var(--color-accent)_40%,var(--color-card))]',
                            { 'min-w-0.75': auditStatus.percentage > 0 }
                        ]"
                        :style="{ width: `${auditStatus.percentage}%` }"
                    />
                </div>
                <!-- Centred in the space below the audit bar ('pt-0.75' clears its 3px), and trimmed to its letters so
                     it is centred on them rather than sitting high in its line box. Long text is cut off sideways only
                     ('overflow-x: clip'), because hiding overflow on both axes would clip the tails of letters like 'g'
                     below the trimmed box. -->
                <p class="min-w-0 overflow-x-clip text-ellipsis whitespace-nowrap [text-box:trim-both_cap_alphabetic]">
                    <template v-if="auditStatus">
                        <span aria-hidden="true">{{ shownAuditStatusText }}</span>
                        <span class="sr-only">{{ auditStatus.text }}</span>
                    </template>
                </p>
                <p v-if="previewExtentText" class="flex-none whitespace-nowrap [text-box:trim-both_cap_alphabetic]">{{ previewExtentText }}</p>
            </div>
        </template>


        <template #no-selection>
            {{ infoString }}
            <SelectPlaceholder :message="t(TEXT, `${itemSubject}.select.text`)" />
        </template>
    </GridDetailPanel>
</template>
