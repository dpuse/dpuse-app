<script setup lang="ts">
// ── Template Notes ─ TODO: Revisit later. These belong beside their elements in the template, but a comment at the
// template's root breaks the fade between route views in development: Vue never reports the old view as gone, so the
// next one never appears. Production builds strip comments, so only development is affected.
// - List error notice: covers the region, because without the list there is nothing to choose from. An item's error
//   covers only the detail, so the list stays usable.

// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    BracesIcon,
    CheckIcon,
    ChevronDownIcon,
    CircleAlertIcon,
    CircleOffIcon,
    FileIcon,
    FolderIcon,
    InfoIcon,
    LanguagesIcon,
    ScanTextIcon,
    SheetIcon,
    TextIcon,
    TriangleAlertIcon
} from '@lucide/vue';
import { type Component, computed, markRaw, nextTick, ref, shallowRef, useId, useTemplateRef, watch } from 'vue';
import { onClickOutside, until } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import {
    AppError,
    DATA_FORMAT_ICON_CONFIGS,
    formatNumberAsDecimalNumber,
    formatNumberAsStorageSize,
    getEncodingTypeConfigs,
    listParserToolConfigs,
    localiseConfigs
} from '@dpuse/dpuse-shared';
import type {
    ConnectionConfig,
    ConnectionNodeConfig,
    DataFormatId,
    DataViewConfig,
    GetInfoOptions,
    GetInfoResult,
    ListNodesOptions,
    ListNodesResult,
    LocalisedConfig,
    PreviewConfig,
    PreviewIssue,
    PreviewIssueSeverityId,
    PreviewObjectOptions
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { constructItemPath } from '../dataViewSummary';
import type { DataSource } from '@/composables/useDataWindow';
import { establishEngineWorker } from '@/services/engine';
import { ignoreReportedNavigationFailure } from '@/router';
import { renderMarkdown } from '@/services/useMarkedTool';
import { TEXT } from './SelectItemPanel_.json';
import { viewportIsWide } from '@/state/device';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { findConnectionLocalisedConfig, toolConfigs } from '@/state/configs';
import { localeId, t } from '@/state/locale';
import { resolveDataViewIdParameter, useDataView, useUpdateDataView } from '@/features/studio/dataViews/_dataViews';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import BusyBar from '@/components/ui/BusyBar.vue';
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ConfigIcon from '@/components/ui/config/ConfigIcon.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import HouseIcon from '@/components/icons/HouseIcon.vue';
import ItemButton from '@/components/ui/action/ItemButton.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import SelectInput from '@/components/ui/SelectInput.vue';
import type { SelectOption } from '@/components/ui/SelectInput.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';
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

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Preview Tabs ─ Ways to show the item. Only delimited text has a table to show.
const PREVIEW_TABS: PreviewTab[] = [
    { icon: markRaw(SheetIcon), id: 'table', labelKey: 'tab.table.label' },
    { icon: markRaw(TextIcon), id: 'text', labelKey: 'tab.text.label' },
    { icon: markRaw(InfoIcon), id: 'details', labelKey: 'tab.details.label' }
];

// ── Data Formats ─ The formats the app can read today. Only delimited text is data. Markdown is a document, so it is
// not parsed and its table tab is disabled. JSON, JSON Lines and the other planned formats wait for their own reader, so
// they show as text and cannot be selected.
const TEXT_DATA_FORMAT_IDS = new Set<DataFormatId>(['dtv', 'markdown']);
const TABLE_DATA_FORMAT_IDS = new Set<DataFormatId>(['dtv']);
const READABLE_DATA_FORMAT_IDS = new Set<DataFormatId>(['dtv']); // Marked as supported in the toolbar, and the formats the user can choose to read an item as data.
const PLANNED_DATA_FORMAT_IDS = new Set<DataFormatId>(['arrow', 'avro', 'json', 'jsonl', 'ods', 'parquet', 'sav', 'sqlite', 'xlsx', 'xml']); // Data the app means to read once each has a reader.

// ── Format Supports ─ How the toolbar marks the format: readable, planned but with no reader yet, or not data at all.
const FORMAT_SUPPORTS: FormatSupport[] = [
    { ariaKey: 'format.supported.aria', colorClass: 'text-success-text', icon: markRaw(CheckIcon), id: 'supported' },
    { ariaKey: 'format.planned.aria', colorClass: 'text-warning-text', id: 'planned' },
    { ariaKey: 'format.unsupported.aria', colorClass: 'text-danger-text', icon: markRaw(CircleOffIcon), id: 'unsupported' }
];

// ── Preview Issues ─ The app's own wording for the issues it knows, by the parser's code. Any other issue shows the
// parser's message, which is in English. Each severity has its own icon and colour, as status tags do.
const PREVIEW_ISSUE_TEXT_KEYS: Partial<Record<string, keyof typeof TEXT>> = {
    CSV_INVALID_CLOSING_QUOTE: 'issue.invalidClosingQuote.text',
    CSV_NON_TRIMABLE_CHAR_AFTER_CLOSING_QUOTE: 'issue.charAfterClosingQuote.text',
    CSV_QUOTE_NOT_CLOSED: 'issue.quoteNotClosed.text',
    empty: 'issue.empty.text',
    INVALID_OPENING_QUOTE: 'issue.invalidOpeningQuote.text'
};
const PREVIEW_ISSUE_SEVERITIES: Record<PreviewIssueSeverityId, { bandClass: string; colorClass: string; icon: Component; lineHighlightId: LineHighlightId }> = {
    error: { bandClass: 'bg-danger', colorClass: 'text-danger-text', icon: markRaw(CircleAlertIcon), lineHighlightId: 'danger' },
    info: { bandClass: 'bg-info', colorClass: 'text-info-text', icon: markRaw(InfoIcon), lineHighlightId: 'info' },
    warning: { bandClass: 'bg-warning', colorClass: 'text-warning-text', icon: markRaw(TriangleAlertIcon), lineHighlightId: 'warning' }
};
const PREVIEW_ISSUE_SEVERITY_IDS: PreviewIssueSeverityId[] = ['error', 'warning', 'info']; // Most serious first.

const AUTO_OPTION_ID = 'auto'; // The selects' value for 'read it as detected'. No format or encoding has this id.
const CONTAINER_FILE_TYPE_EXTENSIONS = new Set(['cfb']); // Detected types that only name a container, e.g. a legacy Excel or Word file, so the item's own extension names it better.
const DATA_FORMAT_LABEL_KEYS: Record<DataFormatId, keyof typeof TEXT> = {
    arrow: 'dataFormat.arrow.label',
    avro: 'dataFormat.avro.label',
    dtv: 'dataFormat.dtv.label',
    json: 'dataFormat.json.label',
    jsonl: 'dataFormat.jsonl.label',
    markdown: 'dataFormat.markdown.label',
    ods: 'dataFormat.ods.label',
    parquet: 'dataFormat.parquet.label',
    sav: 'dataFormat.sav.label',
    sqlite: 'dataFormat.sqlite.label',
    unknown: 'dataFormat.unknown.label',
    xlsx: 'dataFormat.xlsx.label',
    xml: 'dataFormat.xml.label'
};

// useDataWindow's retry-with-backoff (~900ms total) is tuned for transient blips, not a cold app boot — on a fresh
// deploy in particular, downloading new bundles, waking configMonitor/accountMonitor's Durable Objects, and then
// resolving the active connection via the data view's own engine round-trip can easily take longer than that. So instead of a short fixed retry, wait directly on the value itself.
// Deciding whether the connection has genuinely disappeared (vs. just not resolved yet) is DataViewsLayout's
// job, not this function's — it redirects away (unmounting this component) once that's confirmed, so this only
// needs a generous timeout as a last-resort bail-out for the case where neither ever happens.
const ACTIVE_CONNECTION_CONFIG_WAIT_TIMEOUT_MS = 20_000;

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{
    'draft-changed': [draftDataViewConfig: DataViewConfig | undefined]; // The data view as the pick would leave it, shown above the step until it is saved.
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
const activePreviewConfig = shallowRef<PreviewConfig>(); // Kept so the commit can save it with the item.
const pickedItemConfig = shallowRef<ConnectionNodeConfig>(); // The item the user last picked, whose preview is reported with it. A saved item restored on opening is not one.

// ── Read Choices ─ How the user chose to read the item, in place of what the preview detected. Cleared for each item.
// What was detected is kept apart, because a preview read the user's way reports their choice, and the selects' Auto
// option still names what detection found.
const selectedDataFormatId = ref<DataFormatId>();
const selectedEncodingId = ref<string>();
const selectedParserId = ref<string>(); // The config id of the tool chosen to read the item.
const detectedDataFormatId = ref<DataFormatId>();
const detectedEncodingId = ref<string>();
const detectedParserId = ref<string>();
const detectedEncodingIsAssumed = ref(false);

// ── Preview Tabs ─ Tabs and their panel reference each other by id, which must be unique on the page. Below 'md' the
// tabs fold into a menu.
const elementIdPrefix = useId();
const currentPreviewTabId = ref<PreviewTabId>('table');
const previewTabMenuElement = useTemplateRef<HTMLDivElement>('previewTabMenu');
const previewTabMenuIsOpen = ref(false);
const textViewerComponent = useTemplateRef<InstanceType<typeof TextViewer>>('textViewer');

const previewIsPending = ref(false); // The preview table is empty until the engine answers, which reads as an empty item unless the wait is shown.
const hasLastPreviewSucceeded = ref(false); // Whether the last preview to finish loaded, so the Audit button stays in place while the next item loads.
const previewTableColumnDefinitions = shallowRef<ColumnDef<TableFeatureSet, Record<string, string | null>>[]>([]);
const previewTableDataSource = shallowRef<DataSource<Record<string, string | null>>>({
    rowCount: 0,
    getRows: (): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: [] })
});

const route = useRoute();
const router = useRouter();

// ── Data View ─ 'isPending' stops a second commit while the first is still saving.
const { data: dataViewConfig } = useDataView(() => resolveDataViewIdParameter(route.params.dataViewId));
const { isPending: dataViewIsSaving, mutateAsync: updateDataView } = useUpdateDataView();

const text = ref<string | undefined>();

// TODO: Fix this icon data type compatibility issue.
const homeBreadcrumb = { id: 'home', icon: markRaw(HouseIcon), label: 'Home' } as unknown as ConnectionNodeConfig;

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// The saved connection, which this step lists the items of. Looked up again from the list, so it follows a change of
// language.
const activeConnectionConfig = computed(() => findConnectionLocalisedConfig(dataViewConfig.value?.connectionId));
const itemSubject = computed(() => activeConnectionConfig.value?.connectorConfig.itemTypeId ?? 'item'); // Wording names the connector's kind of item, e.g. 'File', and falls back to 'item' for a connector released before it said which.

// Every item shows the icon for the connector's kind of item, as the summary row does. A file's real format is only
// known once it is previewed, so its name extension is not used to guess one.
const itemTypeIcon = computed(() => {
    const itemTypeId = activeConnectionConfig.value?.connectorConfig.itemTypeId;
    if (itemTypeId === 'apiEndpoint') return BracesIcon;
    return itemTypeId === 'file' ? FileIcon : SheetIcon; // A connector released before it named its kind of item shows tables, as the summary row does.
});

const breadcrumbs = computed<ConnectionNodeConfig[]>(() => [homeBreadcrumb, ...currentFolderNodes.value]);
const backLabel = computed(() => currentFolderNodes.value.at(-1)?.label ?? t(TEXT, 'home.label')); // Names the folder the back button returns to.

// ── Preview ─ A file the preview could not read as text says so on the details tab.
const previewIsUnsupported = computed(() => activePreviewConfig.value != null && !TEXT_DATA_FORMAT_IDS.has(activePreviewConfig.value.dataFormatId));
const previewIsMarkdown = computed(() => activePreviewConfig.value?.dataFormatId === 'markdown'); // The text tab shows markdown rendered rather than as source.

const previewFormatText = computed(() => (activePreviewConfig.value == null ? undefined : constructDataFormatText(activePreviewConfig.value.dataFormatId)));
const previewFormatIconConfig = computed(() => {
    const dataFormatId = activePreviewConfig.value?.dataFormatId;
    return dataFormatId == null || dataFormatId === 'unknown' ? undefined : DATA_FORMAT_ICON_CONFIGS[dataFormatId]; // A file the app cannot place shows no data, so it has no format icon.
});
const previewFormatSupport = computed(() => {
    const dataFormatId = activePreviewConfig.value?.dataFormatId;
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
const previewIssues = computed(() => activePreviewConfig.value?.issues ?? []);
const previewHasErrorIssue = computed(() => previewIssues.value.some((issue) => issue.severityId === 'error'));
// Each issue says all it can about where it is: its lines, its record and its value within the record, each as its own
// phrase, so a language can order its words. The value at fault shows as it appears in the file.
const previewIssueItems = computed(() =>
    previewIssues.value.map((issue, index) => ({
        ...PREVIEW_ISSUE_SEVERITIES[issue.severityId],
        fieldText: issue.fieldNumber == null ? undefined : t(TEXT, 'issue.field.text', { field: formatCount(issue.fieldNumber) }),
        key: `${String(index)}-${issue.id}`,
        lineNumber: issue.lineNumber,
        lineText: constructPreviewIssueLineText(issue),
        recordText: issue.recordNumber == null ? undefined : t(TEXT, 'issue.record.text', { record: formatCount(issue.recordNumber) }),
        text: constructPreviewIssueText(issue),
        value: issue.value,
        valueName: constructPreviewIssueValueName(issue.value)
    }))
);
const previewIssueCountText = computed(() => {
    const count = previewIssues.value.length;
    if (count === 0) return;
    return t(TEXT, count === 1 ? 'issue.one.text' : 'issue.other.text', { count });
});
const previewIssueBandClass = computed(() => {
    const severityId = PREVIEW_ISSUE_SEVERITY_IDS.find((id) => previewIssues.value.some((issue) => issue.severityId === id));
    return severityId == null ? undefined : PREVIEW_ISSUE_SEVERITIES[severityId].bandClass;
});
// The text tab colours each line an issue names. A line with several issues takes the colour of the most serious.
// Every line an issue covers, from where it starts to where it ends, e.g. all the lines a quote never closed runs over.
const previewLineHighlights = computed(() => {
    const lineHighlights = new Map<number, LineHighlightId>();
    for (const severityId of PREVIEW_ISSUE_SEVERITY_IDS.toReversed()) {
        for (const issue of previewIssues.value) {
            if (issue.severityId !== severityId || issue.lineNumber == null) continue;
            for (let lineNumber = issue.lineNumber; lineNumber <= (issue.endLineNumber ?? issue.lineNumber); lineNumber++) {
                lineHighlights.set(lineNumber, PREVIEW_ISSUE_SEVERITIES[severityId].lineHighlightId);
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
        ...sortOptionsByLabel(Array.from(READABLE_DATA_FORMAT_IDS, (id) => ({ groupLabel: supportedGroupLabel, id, label: t(TEXT, DATA_FORMAT_LABEL_KEYS[id]) }))),
        ...sortOptionsByLabel(Array.from(PLANNED_DATA_FORMAT_IDS, (id) => ({ groupLabel: plannedGroupLabel, id, isDisabled: true, label: t(TEXT, DATA_FORMAT_LABEL_KEYS[id]) }))),
        { groupLabel: documentGroupLabel, id: 'markdown', label: t(TEXT, DATA_FORMAT_LABEL_KEYS.markdown) } // Shown rendered, so a file read another way can be read as markdown again.
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

// The tools that read the previewed format. Auto names the one that read it. The select shows only when there is a
// choice, because most formats have a single parser.
const parserOptions = computed<SelectOption[]>(() => {
    const dataFormatId = activePreviewConfig.value?.dataFormatId;
    if (dataFormatId == null) return [];
    const options: SelectOption[] = localiseConfigs(listParserToolConfigs(toolConfigs.value, dataFormatId), localeId.value).map(({ id, label }) => ({ id, label }));
    const detectedLabel = options.find((option) => option.id === detectedParserId.value)?.label;
    return [constructAutoOption(detectedLabel), ...options];
});
const parserIsChoosable = computed(() => parserOptions.value.length > 2); // Auto, and more than one parser.

// The value each select shows: the user's choice, or else what the preview detected. Choosing reads the item again. A
// new format clears the chosen parser, which may not read it.
const previewDataFormatId = computed({
    get: () => selectedDataFormatId.value ?? AUTO_OPTION_ID,
    set: (dataFormatId: string) => {
        selectedDataFormatId.value = dataFormatId === AUTO_OPTION_ID ? undefined : (dataFormatId as DataFormatId); // The other options are all format ids.
        selectedParserId.value = undefined;
    }
});
const previewEncodingId = computed({
    get: () => selectedEncodingId.value ?? AUTO_OPTION_ID,
    set: (encodingId: string) => {
        selectedEncodingId.value = encodingId === AUTO_OPTION_ID ? undefined : encodingId;
    }
});
const previewParserId = computed({
    get: () => selectedParserId.value ?? AUTO_OPTION_ID,
    set: (parserId: string) => {
        selectedParserId.value = parserId === AUTO_OPTION_ID ? undefined : parserId;
    }
});

// How much of the item the preview read. A percentage whenever the item's size is known, so the meter shows a whole
// item as complete as well as how little of a large one was read. The toolbar shows the short text, and screen readers
// get the full one.
const previewAmount = computed(() => {
    const previewConfig = activePreviewConfig.value;
    if (previewConfig == null) return;
    const previewSize = previewConfig.size ?? 0;
    const itemSize = activeConnectionObjectConfig.value?.size ?? 0;
    const size = formatNumberAsStorageSize(previewSize);
    if (itemSize === 0) return { isComplete: false, percentage: undefined, shortText: size, text: t(TEXT, 'preview.sizeUnknown.text', { size }) };
    if (previewSize === itemSize) return { isComplete: true, percentage: 100, shortText: size, text: t(TEXT, 'preview.entireItem.text', { size }) }; // The green meter and text already say it is all of it.
    const percentage = (previewSize / itemSize) * 100;
    const total = formatNumberAsStorageSize(itemSize);
    const percentageText = formatNumberAsDecimalNumber(percentage, 1, 0);
    return {
        isComplete: false,
        percentage,
        shortText: t(TEXT, 'preview.partial.short.text', { percentage: percentageText, size, total }),
        text: t(TEXT, 'preview.partial.text', { percentage: percentageText, size, total })
    };
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
    const previewConfig = activePreviewConfig.value;
    if (previewConfig == null || previewConfig.parsedRecords.length === 0 || previewHasErrorIssue.value) return false;
    const isOpenedAsTable = TEXT_DATA_FORMAT_IDS.has(previewConfig.dataFormatId) && currentPreviewTabId.value === 'table';
    return TABLE_DATA_FORMAT_IDS.has(previewConfig.dataFormatId) || isOpenedAsTable;
});

// Names the format when there is one, which is every format the app has no reader for yet.
const previewUnsupportedText = computed(() => {
    const previewConfig = activePreviewConfig.value;
    if (previewConfig?.size === 0) return t(TEXT, 'item.empty.text');
    if (previewConfig == null || previewConfig.dataFormatId === 'unknown') return t(TEXT, 'item.unsupported.text');
    return t(TEXT, 'item.unsupportedFormat.text', { format: t(TEXT, DATA_FORMAT_LABEL_KEYS[previewConfig.dataFormatId]) });
});

// The details tab lists only the facts there are: a listing or a preview can leave any of them out.
const itemDetails = computed(() => {
    const connectionNodeConfig = activeConnectionObjectConfig.value;
    const previewConfig = activePreviewConfig.value;
    if (connectionNodeConfig == null || previewConfig == null) return [];
    const details: { labelKey: keyof typeof TEXT; value: string | undefined }[] = [
        { labelKey: 'detail.dataFormat.label', value: previewFormatText.value },
        { labelKey: 'detail.fileType.label', value: previewConfig.fileType?.mime ?? connectionNodeConfig.mimeType },
        { labelKey: 'detail.encoding.label', value: constructEncodingText(previewConfig) },
        { labelKey: 'detail.size.label', value: formatNumberAsStorageSize(connectionNodeConfig.size) },
        {
            labelKey: 'detail.lastModified.label',
            value:
                connectionNodeConfig.lastModifiedAt == null
                    ? undefined
                    : new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeStyle: 'short' }).format(connectionNodeConfig.lastModifiedAt)
        },
        { labelKey: 'detail.path.label', value: constructItemPath(connectionNodeConfig) },
        { labelKey: 'detail.issues.label', value: previewIssueCountText.value } // Listed in the band above the tabs.
    ];
    return details.filter((detail) => detail.value != null && detail.value !== '');
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
                return { rows: result.connectionNodeConfigs as unknown as LocalisedConfig<ConnectionNodeConfig>[], totalCount: result.totalCount };
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
    [activeConnectionObjectConfig, itemAttempt, selectedDataFormatId, selectedEncodingId, selectedParserId],
    async ([newActiveItem, newItemAttempt], oldValues) => {
        const currentRequestId = ++previewRequestId.value;
        itemFailure.value = undefined;
        const [oldActiveItem, oldItemAttempt] = oldValues; // Empty on the first, immediate run, which is never a read choice.
        const isNewReadChoice = newActiveItem === oldActiveItem && newItemAttempt === oldItemAttempt;
        if (!isNewReadChoice) {
            resetPreviewState();
            detectedDataFormatId.value = undefined;
            detectedEncodingId.value = undefined;
            detectedParserId.value = undefined;
        }
        if (newActiveItem == null) return;

        previewIsPending.value = true;
        try {
            const { processRequest } = await establishEngineWorker();
            if (!activeConnectionConfig.value) return;

            const options: PreviewObjectOptions = {
                chunkSize: undefined,
                dataFormatId: selectedDataFormatId.value,
                encodingId: selectedEncodingId.value,
                extension: undefined,
                mimeType: newActiveItem.mimeType,
                parserId: selectedParserId.value,
                path: constructItemPath(newActiveItem)
            };
            const previewConfig = (await processRequest('previewObject', activeConnectionConfig.value, options)) as PreviewConfig;
            if (currentRequestId !== previewRequestId.value || activeConnectionObjectConfig.value !== newActiveItem) return;

            applyPreviewConfig(previewConfig);
            recordDetectedValues(previewConfig);
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

// The picked item is reported once its preview shows it can be selected, with the preview, so the summary above the
// step shows its format. Until then, and while it cannot be selected, it is reported as no item. Opening a markdown
// file as a table can make it selectable without a new preview.
watch([activePreviewConfig, previewIsSelectable], ([previewConfig, isSelectable]) => {
    const pickedItem = pickedItemConfig.value;
    if (pickedItem == null || previewConfig == null) return; // 'pickItem' has already reported no item.
    if (isSelectable) reportDraft(pickedItem, previewConfig);
    else reportDraft();
});

onClickOutside(previewTabMenuElement, () => {
    previewTabMenuIsOpen.value = false;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Clearing the failure alone would show the panel again with the same empty window behind it, so the attempt count is
// bumped too: that rebuilds the data source, which is what makes the window ask for its rows a second time.
function handleRetryList(): void {
    listFailure.value = undefined;
    listAttempt.value++;
}

function handleRetryItem(): void {
    itemAttempt.value++;
}

function handleSelectBreadcrumb(index: number, connectionNodeConfig: ConnectionNodeConfig): void {
    pickItem();
    if (index <= 0) {
        currentFolderNodes.value = [];
        loadFolderNodes(activeConnectionConfig.value, '');
        return;
    }

    currentFolderNodes.value = currentFolderNodes.value.slice(0, index);
    loadFolderNodes(activeConnectionConfig.value, `${connectionNodeConfig.folderPath}/${connectionNodeConfig.name}`);
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
    const index = breadcrumbs.value.length - 1;
    handleSelectBreadcrumb(index, assertDefined(breadcrumbs.value[index]));
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

async function handleTogglePreviewTabMenu(): Promise<void> {
    if (previewTabMenuIsOpen.value) {
        previewTabMenuIsOpen.value = false;
        return;
    }
    await openPreviewTabMenu();
}

// The arrow keys open the menu from its button, as the WAI-ARIA menu button pattern expects.
async function handleOpenPreviewTabMenuByKey(event: KeyboardEvent): Promise<void> {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    await openPreviewTabMenu();
}

// Arrow keys, Home and End move through the menu, skipping a disabled view. Escape closes it and returns to its
// button. Tab closes it and moves on, so focus never stays in a menu that is out of the tab order.
function handleNavigatePreviewTabMenu(event: KeyboardEvent, previewTabIndex: number): void {
    if (event.key === 'Escape') {
        event.preventDefault();
        closePreviewTabMenu();
        return;
    }
    if (event.key === 'Tab') {
        previewTabMenuIsOpen.value = false;
        return;
    }
    const nextIndexByKey: Partial<Record<string, number>> = {
        ArrowDown: stepToEnabledPreviewTabIndex(previewTabIndex, 1),
        ArrowUp: stepToEnabledPreviewTabIndex(previewTabIndex, -1),
        End: stepToEnabledPreviewTabIndex(0, -1),
        Home: stepToEnabledPreviewTabIndex(PREVIEW_TABS.length - 1, 1)
    };
    const nextIndex = nextIndexByKey[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    focusPreviewTabMenuItem(nextIndex);
}

// Opens the text on the line an issue names, so the user sees what the parser could not read.
async function handleShowIssueLine(lineNumber: number): Promise<void> {
    currentPreviewTabId.value = 'text';
    await nextTick(); // The text is only laid out once its tab shows.
    textViewerComponent.value?.scrollToLine(lineNumber);
}

function handleSelectPreviewTab(previewTabId: PreviewTabId): void {
    currentPreviewTabId.value = previewTabId;
    closePreviewTabMenu();
}

// Saved before moving on, so a reload restores the item, and the data view document can show its structure and data.
async function handleCommitDetail(): Promise<void> {
    const connectionNodeConfig = activeConnectionObjectConfig.value;
    const previewConfig = activePreviewConfig.value;
    if (connectionNodeConfig == null || previewConfig == null || !previewIsSelectable.value || dataViewIsSaving.value || dataViewConfig.value == null) return;

    try {
        const storablePreviewConfig: PreviewConfig = {
            ...previewConfig,
            dataFormatId: TABLE_DATA_FORMAT_IDS.has(previewConfig.dataFormatId) ? previewConfig.dataFormatId : 'dtv', // Markdown opened as a table was parsed as delimited text, so it is saved as that.
            text: undefined
        }; // All the parsed records are kept, so the data view panel shows the whole preview block, a few kilobytes at most. The raw text is the same block again, so it is not kept.
        const savedDataViewConfig = await updateDataView({
            ...dataViewConfig.value,
            connectionNodeConfig: constructStorableNodeConfig(connectionNodeConfig),
            previewConfig: storablePreviewConfig,
            contentAuditConfig: isSameAsSavedItem(dataViewConfig.value, connectionNodeConfig, storablePreviewConfig) ? dataViewConfig.value.contentAuditConfig : undefined, // A saved audit still describes the item, so the next step shows it rather than auditing again.
            relationshipsAuditConfig: undefined
        });
        emit('task-completed', taskLocalisedConfig);
        void ignoreReportedNavigationFailure(router.push({ name: 'content', params: { dataViewId: savedDataViewConfig.id }, query: route.query }));
    } catch (error) {
        // Announced rather than shown in the panel: the save did not happen, so the item is still here to commit again.
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.SelectItemPanel.handleCommitDetail', { typeId: 'handled' }, { cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Read again after waiting rather than taken from 'until', which resolves on the timeout too.
async function waitForActiveConnectionConfig(): Promise<LocalisedConfig<ConnectionConfig>> {
    await until(activeConnectionConfig).toBeTruthy({ timeout: ACTIVE_CONNECTION_CONFIG_WAIT_TIMEOUT_MS });
    if (activeConnectionConfig.value == null) throw new Error('Timed out waiting for an active connection config.');
    return activeConnectionConfig.value;
}

function pickItem(connectionNodeConfig?: ConnectionNodeConfig): void {
    activeConnectionObjectConfig.value = connectionNodeConfig;
    pickedItemConfig.value = connectionNodeConfig;
    selectedDataFormatId.value = undefined;
    selectedEncodingId.value = undefined;
    selectedParserId.value = undefined;
    reportDraft(); // A new pick shows as no item until its preview shows it can be selected.
}

// The pick is saved only when it is committed. It is reported before then, so the summary above the step shows it. The
// later steps are cleared in what is reported, because they were worked out from the item it replaces.
function reportDraft(connectionNodeConfig?: ConnectionNodeConfig, previewConfig?: PreviewConfig): void {
    if (dataViewConfig.value == null) return;
    emit('draft-changed', {
        ...dataViewConfig.value,
        connectionNodeConfig: connectionNodeConfig ? constructStorableNodeConfig(connectionNodeConfig) : undefined,
        previewConfig,
        contentAuditConfig: undefined,
        relationshipsAuditConfig: undefined
    });
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
        childNodes: [],
        extension: undefined,
        folderPath: index === 0 ? '' : `/${names.slice(0, index).join('/')}`,
        handle: undefined,
        lastModifiedAt: undefined,
        mimeType: undefined,
        name,
        size: undefined,
        typeId: 'folder'
    }));
}

// The encoding the preview detected, with how sure the detection was. Without a confidence level nothing was detected
// and the preview fell back to UTF-8, so the encoding is marked as assumed.
function constructEncodingText(previewConfig: PreviewConfig): string | undefined {
    if (previewConfig.encodingId == null) return;
    const encoding = previewConfig.encodingId;
    if (previewConfig.encodingConfidenceLevel == null) return t(TEXT, 'detail.encoding.assumed.text', { encoding });
    const confidence = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 }).format(previewConfig.encodingConfidenceLevel);
    return t(TEXT, 'detail.encoding.text', { confidence, encoding });
}

// What detection found, from a preview the user has not chosen how to read. A choice of one value leaves the other to
// detection, so each is taken only while it was not chosen.
function recordDetectedValues(previewConfig: PreviewConfig): void {
    if (selectedDataFormatId.value == null) detectedDataFormatId.value = previewConfig.dataFormatId;
    if (selectedParserId.value == null) detectedParserId.value = previewConfig.parserId;
    if (selectedEncodingId.value != null) return;
    detectedEncodingId.value = previewConfig.encodingId;
    detectedEncodingIsAssumed.value = previewConfig.encodingConfidenceLevel == null;
}

// Auto, naming what detection found once it is known. The value comes first, so a select short of room cuts '(auto)'
// and keeps the value. The line after it sets it apart from the values it chooses between.
function constructAutoOption(detectedText?: string, isAssumed = false): SelectOption {
    let label = t(TEXT, 'readOption.auto.label');
    if (detectedText != null) label = t(TEXT, isAssumed ? 'readOption.autoAssumed.label' : 'readOption.autoDetected.label', { value: detectedText });
    return { hasSeparatorAfter: true, id: AUTO_OPTION_ID, label };
}

// A file recognised as something other than data, such as a PDF or an image, has no format, so the type the preview
// detected names it instead. A container type names it by the item's extension, so a legacy Excel file reads 'XLS'.
function constructDataFormatText(dataFormatId: DataFormatId): string {
    const fileType = activePreviewConfig.value?.fileType;
    if (fileType == null || dataFormatId !== 'unknown') return t(TEXT, DATA_FORMAT_LABEL_KEYS[dataFormatId]);
    const itemExtension = activeConnectionObjectConfig.value?.extension;
    const isNamedByItem = itemExtension != null && itemExtension !== '' && CONTAINER_FILE_TYPE_EXTENSIONS.has(fileType.ext);
    return (isNamedByItem ? itemExtension : fileType.ext).toUpperCase();
}

// Sorted by label in the current language, because translation changes the order.
function sortOptionsByLabel(options: SelectOption[]): SelectOption[] {
    return options.toSorted((left, right) => left.label.localeCompare(right.label, localeId.value));
}

// Focus goes to the current view, so the arrow keys start from what is already chosen.
async function openPreviewTabMenu(): Promise<void> {
    previewTabMenuIsOpen.value = true;
    await nextTick();
    focusPreviewTabMenuItem(PREVIEW_TABS.findIndex((previewTab) => previewTab.id === currentPreviewTabId.value));
}

function closePreviewTabMenu(): void {
    previewTabMenuIsOpen.value = false;
    previewTabMenuElement.value?.querySelector<HTMLElement>('[aria-haspopup="menu"]')?.focus();
}

function focusPreviewTabMenuItem(previewTabIndex: number): void {
    previewTabMenuElement.value?.querySelectorAll<HTMLElement>('[role="menuitemradio"]')[previewTabIndex]?.focus();
}

// Only a format the app can read as data has a table to show, and only when something was parsed without an error.
// Markdown, a format not supported yet and one that never will be all show as text. The table stays enabled while
// there is no preview, so the tabs do not flicker as it loads.
function isPreviewTabDisabled(previewTabId: PreviewTabId): boolean {
    const previewConfig = activePreviewConfig.value;
    return (
        previewTabId === 'table' &&
        previewConfig != null &&
        (previewHasErrorIssue.value || previewConfig.parsedRecords.length === 0 || !READABLE_DATA_FORMAT_IDS.has(previewConfig.dataFormatId))
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

// A file handle cannot be stored, and children are listed afresh.
function constructStorableNodeConfig(connectionNodeConfig: ConnectionNodeConfig): ConnectionNodeConfig {
    return { ...connectionNodeConfig, childNodes: [], handle: undefined };
}

// Whether the item committed is the one saved, unchanged since, and read the same way, so its saved audit still applies.
function isSameAsSavedItem(dataViewConfig: DataViewConfig, connectionNodeConfig: ConnectionNodeConfig, previewConfig: PreviewConfig): boolean {
    const savedNodeConfig = dataViewConfig.connectionNodeConfig;
    const savedPreviewConfig = dataViewConfig.previewConfig;
    return (
        savedNodeConfig != null &&
        savedPreviewConfig != null &&
        constructItemPath(savedNodeConfig) === constructItemPath(connectionNodeConfig) &&
        savedNodeConfig.lastModifiedAt === connectionNodeConfig.lastModifiedAt &&
        savedPreviewConfig.dataFormatId === previewConfig.dataFormatId &&
        savedPreviewConfig.encodingId === previewConfig.encodingId &&
        savedPreviewConfig.parserId === previewConfig.parserId &&
        savedPreviewConfig.hasHeaders === previewConfig.hasHeaders &&
        savedPreviewConfig.recordDelimiterId === previewConfig.recordDelimiterId &&
        savedPreviewConfig.valueDelimiterId === previewConfig.valueDelimiterId
    );
}

function resetPreviewState(): void {
    activePreviewConfig.value = undefined;
    previewIsPending.value = false;
    previewTableColumnDefinitions.value = [];
    previewTableDataSource.value = {
        rowCount: 0,
        getRows: (): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: [] })
    };
    text.value = undefined;
}

function applyPreviewConfig(previewConfig: PreviewConfig): void {
    activePreviewConfig.value = previewConfig;
    currentPreviewTabId.value = establishFirstPreviewTabId(previewConfig);
    text.value = previewConfig.text;

    const previewColumnLabels = previewConfig.columnConfigs.map((config, index) => config.label.en ?? String(index));

    // Columns are keyed by position, not header text. TanStack reads a dot in an 'accessorKey' as a nested path, and two
    // columns with the same header text would share one key.
    previewTableColumnDefinitions.value = previewColumnLabels.map<ColumnDef<TableFeatureSet, Record<string, string | null>>>((label, index) => ({
        accessorKey: String(index),
        header: label
    }));

    const dataOffset = 1;
    const previewRows = previewConfig.parsedRecords
        .slice(dataOffset)
        .map((record) => Object.fromEntries(record.map((cell, index) => [String(index), cell.value])) as Record<string, string | null>);

    previewTableDataSource.value = {
        rowCount: previewRows.length,
        getRows: (start: number, end: number): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: previewRows.slice(start, end) })
    };
}

// The tab that shows the item as its format suggests: data as a table, anything else as text. Data with no usable
// table opens on the text, so the user can see why. Every other tab stays available, apart from a disabled table.
function establishFirstPreviewTabId(previewConfig: PreviewConfig): PreviewTabId {
    const tableIsUsable = previewConfig.parsedRecords.length > 0 && (previewConfig.issues ?? []).every((issue) => issue.severityId !== 'error');
    return tableIsUsable && TABLE_DATA_FORMAT_IDS.has(previewConfig.dataFormatId) ? 'table' : 'text';
}

function constructPreviewIssueLineText(issue: PreviewIssue): string | undefined {
    if (issue.lineNumber == null) return;
    if (issue.endLineNumber == null) return t(TEXT, 'issue.line.text', { line: formatCount(issue.lineNumber) });
    return t(TEXT, 'issue.lines.text', { end: formatCount(issue.endLineNumber), start: formatCount(issue.lineNumber) });
}

// A value of only spaces or tabs cannot be seen, so it is named instead.
function constructPreviewIssueValueName(value: string | undefined): string | undefined {
    if (value?.trim() !== '') return;
    if (value === ' ') return t(TEXT, 'issue.value.space.text');
    if (value === '\t') return t(TEXT, 'issue.value.tab.text');
    return t(TEXT, 'issue.value.whitespace.text');
}

function formatCount(count: number): string {
    return formatNumberAsDecimalNumber(count, 0, 0, localeId.value);
}

function constructPreviewIssueText(issue: PreviewIssue): string {
    const textKey = PREVIEW_ISSUE_TEXT_KEYS[issue.id];
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

    <GridDetailPanel v-else :selected-item="activeConnectionObjectConfig" :data-source="connectionNodeConfigsDataSource" :is-compact="true" max-grid-width="400px">
        <template #header="{ isSplit }">
            <div class="flex h-full min-w-0 items-center gap-x-3 border-b border-separator px-page text-sm">
                <!-- The last crumb is the item on show. It leads back to the list, so it stays live only while the list
                     is hidden; 'isSplit' comes from the panel below so the two cannot disagree about that. -->
                <!-- Back Button ─ Narrow screens show the preview in place of the list, so the trail gives way to
                     one button back to it. The arrow and 'gap-x-2' match the icon and gap of each row in
                     'DataViewSource', so the arrow centres under those icons and the label lines up with theirs. -->
                <ActionWrapper
                    v-if="!isSplit && activeConnectionObjectConfig != null"
                    :aria-label="t(TEXT, 'back.aria', { label: backLabel })"
                    class="flex h-9.25 min-w-0 flex-1 cursor-pointer items-center gap-x-2 text-accent transition-colors hover:text-accent-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    @click="handleReturnToList"
                >
                    <ArrowLeftIcon aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                    <span class="min-w-0 truncate">{{ backLabel }}</span>
                </ActionWrapper>
                <Breadcrumbs
                    v-else
                    class="h-9.25 min-w-0 flex-1"
                    :items="breadcrumbs"
                    :disable-last="isSplit || activeConnectionObjectConfig == null"
                    @select="handleSelectBreadcrumb"
                />
            </div>
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
            />
        </template>

        <template #detail="{ item }">
            <ErrorNotice v-if="itemFailure" :failures="[itemFailure]" @retry="handleRetryItem" />
            <!-- Preview Toolbar ─ Sits over the preview only, so the breadcrumbs keep the whole header row. -->
            <div v-else class="relative flex h-9.25 flex-none items-center gap-x-3 border-b border-separator px-page text-xs text-muted">
                <!-- Preview Meter ─ Along the top edge, clear of the selected tab's underline at the bottom. Only when the
                     item's size is known. Green when the whole item was read. The grey track shows how much was not. Any
                     amount read keeps a minimum width, so a sliver read from a large item is still visible rather than
                     looking like nothing. A meter rather than a progress bar, because it shows a settled amount, not
                     work under way. -->
                <div
                    v-if="previewAmount?.percentage != null"
                    :aria-label="t(TEXT, 'preview.aria')"
                    aria-valuemax="100"
                    aria-valuemin="0"
                    :aria-valuenow="Math.round(previewAmount.percentage)"
                    :aria-valuetext="previewAmount.text"
                    class="absolute inset-x-0 top-0 h-0.75 bg-separator/50"
                    role="meter"
                >
                    <div
                        class="h-full"
                        :class="[
                            previewAmount.isComplete
                                ? 'bg-[color-mix(in_srgb,var(--color-success-text)_40%,var(--color-card))]'
                                : 'bg-[color-mix(in_srgb,var(--color-accent)_40%,var(--color-card))]',
                            { 'min-w-0.75': previewAmount.percentage > 0 }
                        ]"
                        :style="{ width: `${previewAmount.percentage}%` }"
                    />
                </div>
                <!-- Hidden from screen readers when the meter already reads it out. Sized to its text, and the selects give
                     way first, so the amount always shows. 'mr-auto' pushes the rest of the toolbar to the right. -->
                <p v-if="previewAmount" :aria-hidden="previewAmount.percentage != null" class="mr-auto flex-none">
                    <span aria-hidden="true">{{ previewAmount.shortText }}</span>
                    <span class="sr-only">{{ previewAmount.text }}</span>
                </p>
                <span v-else class="flex-1" />

                <!-- Format, Encoding and Parser ─ Choosing any of them reads the item again that way. A binary file has no
                     encoding to choose, and the parser is offered only when more than one reads the format. -->
                <SelectInput
                    v-if="previewFormatText"
                    v-model="previewDataFormatId"
                    :is-default="selectedDataFormatId == null"
                    class="min-w-0"
                    :description="previewFormatSupport ? t(TEXT, previewFormatSupport.ariaKey) : undefined"
                    :disabled="previewIsPending"
                    is-compact
                    :label="t(TEXT, 'format.label')"
                    label-hidden
                    :options="dataFormatOptions"
                >
                    <!-- One icon: the format's own for a format the app can read or plans to, greyed out while it has no reader,
                         and otherwise why it cannot be read. -->
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
                </SelectInput>
                <SelectInput
                    v-if="activePreviewConfig?.encodingId != null"
                    v-model="previewEncodingId"
                    :is-default="selectedEncodingId == null"
                    class="min-w-0"
                    :disabled="previewIsPending"
                    is-compact
                    :label="t(TEXT, 'encoding.label')"
                    label-hidden
                    :options="encodingOptions"
                >
                    <template #icon><LanguagesIcon aria-hidden="true" class="size-[1.25em] flex-none text-muted" /></template>
                </SelectInput>
                <SelectInput
                    v-if="parserIsChoosable"
                    v-model="previewParserId"
                    :is-default="selectedParserId == null"
                    class="min-w-0"
                    :disabled="previewIsPending"
                    is-compact
                    :label="t(TEXT, 'parser.label')"
                    label-hidden
                    :options="parserOptions"
                >
                    <template #icon><ScanTextIcon aria-hidden="true" class="size-[1.25em] flex-none text-muted" /></template>
                </SelectInput>

                <!-- Preview Tabs ─ Icons rather than words, to leave the toolbar room. '-mr-1.5' centres the last icon 30px
                     from the edge, under the assistant toggle. -->
                <div
                    v-if="viewportIsWide"
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
                        :class="previewTab.id === currentPreviewTabId ? 'border-b-accent text-accent' : 'border-b-transparent text-muted'"
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

                <!-- Preview Tab Menu ─ The tabs below 'md', showing only the current view's icon, so the toolbar keeps room for
                     the rest. '-mr-3' centres the button 30px from the edge, under the assistant toggle. -->
                <div v-else ref="previewTabMenu" class="relative -mr-3 flex-none">
                    <ActionWrapper
                        :aria-controls="`${elementIdPrefix}-menu`"
                        :aria-expanded="previewTabMenuIsOpen"
                        aria-haspopup="menu"
                        :aria-label="t(TEXT, 'previewTabMenu.aria', { label: item.label, view: t(TEXT, currentPreviewTab.labelKey) })"
                        class="flex h-7 items-center gap-x-0.5 rounded-md px-1 text-accent hover:state-hover active:state-press"
                        :title="t(TEXT, currentPreviewTab.labelKey)"
                        @click="handleTogglePreviewTabMenu"
                        @keydown="handleOpenPreviewTabMenuByKey"
                    >
                        <component :is="currentPreviewTab.icon" aria-hidden="true" class="size-5" :stroke-width="1.5" />
                        <ChevronDownIcon aria-hidden="true" class="size-3.5" :stroke-width="1.5" />
                    </ActionWrapper>

                    <div
                        v-if="previewTabMenuIsOpen"
                        :id="`${elementIdPrefix}-menu`"
                        :aria-label="t(TEXT, 'previewTabs.aria', { label: item.label })"
                        class="absolute top-full right-0 z-30 mt-1 min-w-40 rounded-md border border-separator bg-surface p-1 text-sm text-content shadow-md"
                        role="menu"
                    >
                        <ItemButton
                            v-for="(previewTab, previewTabIndex) in PREVIEW_TABS"
                            :key="previewTab.id"
                            :aria-checked="previewTab.id === currentPreviewTabId"
                            class="mt-0.5 flex items-center gap-x-2 first:mt-0"
                            :disabled="isPreviewTabDisabled(previewTab.id)"
                            :is-active="previewTab.id === currentPreviewTabId"
                            role="menuitemradio"
                            tabindex="-1"
                            @click="handleSelectPreviewTab(previewTab.id)"
                            @keydown="handleNavigatePreviewTabMenu($event, previewTabIndex)"
                        >
                            <component :is="previewTab.icon" aria-hidden="true" class="size-5 flex-none" :stroke-width="1.5" />
                            <span>{{ t(TEXT, previewTab.labelKey) }}</span>
                        </ItemButton>
                    </div>
                </div>
            </div>
            <!-- Preview Issues ─ Between the toolbar and the tabs, so they show on every tab without hiding the text or details.
                 A long list scrolls rather than pushing the preview out of view. -->
            <div
                v-if="itemFailure == null && previewIssueItems.length > 0"
                class="max-h-32 flex-none overflow-y-auto border-b border-separator px-page py-2 text-sm"
                :class="previewIssueBandClass"
                role="status"
            >
                <ul :aria-label="t(TEXT, 'issues.aria')" class="flex flex-col gap-y-1">
                    <li v-for="issueItem in previewIssueItems" :key="issueItem.key" class="flex items-start gap-x-2">
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
            <!-- A tab panel only from 'md' up, because below it the tabs are a menu instead. -->
            <div
                v-if="itemFailure == null"
                :id="`${elementIdPrefix}-panel`"
                :aria-busy="previewIsPending"
                :aria-labelledby="viewportIsWide ? createPreviewTabElementId(currentPreviewTabId) : undefined"
                class="relative flex min-h-0 flex-1 flex-col"
                :role="viewportIsWide ? 'tabpanel' : undefined"
            >
                <BusyBar v-if="previewIsPending" class="mx-page" />
                <Table
                    v-show="currentPreviewTabId === 'table' && activePreviewConfig != null"
                    class="flex-1"
                    :column-definitions="previewTableColumnDefinitions"
                    :data-source="previewTableDataSource"
                    is-column-picker-hidden
                />
                <TextViewer
                    v-show="currentPreviewTabId === 'text' && activePreviewConfig != null && !previewIsMarkdown"
                    ref="textViewer"
                    class="flex-1"
                    :line-highlights="previewLineHighlights"
                    scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)"
                    :text="text"
                />
                <!-- Markdown ─ Rendered only while shown, as rendering parses the whole preview. 'renderMarkdown' sanitises
                     the HTML, which comes from the file itself. -->
                <ScrollArea v-if="currentPreviewTabId === 'text' && previewIsMarkdown" class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
                    <div class="dpuse-prose px-page py-3 text-sm" v-html="renderMarkdown(text ?? '')" />
                </ScrollArea>
                <ScrollArea
                    v-show="currentPreviewTabId === 'details' && activePreviewConfig != null"
                    class="flex-1"
                    scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)"
                >
                    <p v-if="previewIsUnsupported" class="px-page pt-3 text-sm" role="status">{{ previewUnsupportedText }}</p>
                    <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 px-page py-3 text-sm">
                        <template v-for="detail in itemDetails" :key="detail.labelKey">
                            <dt class="text-muted">{{ t(TEXT, detail.labelKey) }}</dt>
                            <dd class="wrap-break-word">{{ detail.value }}</dd>
                        </template>
                    </dl>
                </ScrollArea>
            </div>
        </template>

        <template #detail-action>
            <!-- Shown once a preview arrives, because the preview is what the commit saves with the item. A first
                 preview that fails therefore never shows the button. Moving on from an item that previewed keeps the
                 button in place while the next one loads, rather than making it blink. Disabled while the preview is
                 not data, or while saving. -->
            <PillButton
                v-if="itemFailure == null && (activePreviewConfig != null || (previewIsPending && hasLastPreviewSucceeded))"
                :disabled="!previewIsSelectable || dataViewIsSaving"
                :icon="ArrowRightIcon"
                :label="t(TEXT, 'detail.audit.label')"
                @click="handleCommitDetail"
            />
        </template>

        <template #no-selection>
            {{ infoString }}
            <SelectPlaceholder :message="t(TEXT, `${itemSubject}.select.text`)" />
        </template>
    </GridDetailPanel>
</template>
