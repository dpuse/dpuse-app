<script setup lang="ts">
// ── Template Notes ─ TODO: Revisit later. These belong beside their elements in the template, but a comment at the
// template's root breaks the fade between route views in development: Vue never reports the old view as gone, so the
// next one never appears. Production builds strip comments, so only development is affected.
// - Engine error notice: covers the region, because without the engine there is nothing to list, preview or open here.

// ── External Dependencies & Registrations
import type { ColumnDef } from '@tanstack/vue-table';
import { ArrowLeftIcon, ArrowRightIcon, BracesIcon, ChevronDownIcon, FileIcon, FolderIcon, InfoIcon, SheetIcon, TextIcon } from '@lucide/vue';
import { type Component, computed, markRaw, nextTick, ref, shallowRef, useId, useTemplateRef, watch } from 'vue';
import { onClickOutside, until } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, formatNumberAsDecimalNumber, formatNumberAsStorageSize } from '@dpuse/dpuse-shared';
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
    PreviewObjectOptions
} from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { constructItemPath } from '../dataViewSummary';
import type { DataSource } from '@/composables/useDataWindow';
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';
import { ignoreReportedNavigationFailure } from '@/router';
import { renderMarkdown } from '@/services/useMarkedTool';
import { TEXT } from './SelectItemPanel_.json';
import { viewportIsWide } from '@/state/device';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { localeId, t } from '@/state/locale';
import { resolveDataViewIdParameter, useDataView, useUpdateDataView } from '@/features/studio/dataViews/_dataViews';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import Breadcrumbs from '@/components/ui/Breadcrumbs.vue';
import BusyBar from '@/components/ui/BusyBar.vue';
import ConfigCard from '@/components/ui/config/ConfigCard.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import GridDetailPanel from '@/components/ui/grid/GridDetailPanel.vue';
import HouseIcon from '@/components/icons/HouseIcon.vue';
import ItemButton from '@/components/ui/action/ItemButton.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import SelectPlaceholder from '@/components/ui/placeholder/SelectPlaceholder.vue';
import Table from '@/components/ui/table/Table.vue';
import type { TableFeatureSet } from '@/components/ui/table/tableFeatures';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';
import TextViewer from '@/components/ui/text/TextViewer.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface PreviewTab {
    icon: Component;
    id: PreviewTabId;
    labelKey: keyof typeof TEXT;
}

type PreviewTabId = 'table' | 'text' | 'details';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Preview Tabs ─ Ways to show the item, which also choose how to open it: a markdown or plain text file opened as a
// table can be selected as data, as can a file whose extension says nothing about its content.
const PREVIEW_TABS: PreviewTab[] = [
    { icon: markRaw(SheetIcon), id: 'table', labelKey: 'tab.table.label' },
    { icon: markRaw(TextIcon), id: 'text', labelKey: 'tab.text.label' },
    { icon: markRaw(InfoIcon), id: 'details', labelKey: 'tab.details.label' }
];

// ── Data Formats ─ The formats the app can read today. Only delimited text is data as it stands, and markdown and plain
// text can be read as delimited text. JSON and JSON Lines are left out until they have their own reader, so they show
// as text and cannot be selected, as XML does.
const TEXT_DATA_FORMAT_IDS = new Set<DataFormatId>(['dtv', 'markdown', 'text']);
const TABLE_DATA_FORMAT_IDS = new Set<DataFormatId>(['dtv']);
const DATA_FORMAT_LABEL_KEYS: Record<DataFormatId, keyof typeof TEXT> = {
    dpe: 'dataFormat.dpe.label',
    dtv: 'dataFormat.dtv.label',
    json: 'dataFormat.json.label',
    jsonl: 'dataFormat.jsonl.label',
    markdown: 'dataFormat.markdown.label',
    spss: 'dataFormat.spss.label',
    text: 'dataFormat.text.label',
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

// Whatever the engine could not do for this panel — list a folder, preview an item, read its info. One ref for all
// three, because they are one loss to the user: the panel cannot reach the connection.
const engineFailure = shallowRef<AppFailure | undefined>();
const engineAttempt = ref(0); // Bumped on retry, which rebuilds the data source and makes the window fetch again.

const currentFolderNodes = shallowRef<ConnectionNodeConfig[]>([]);

const currentFolderPath = ref('');

const previewRequestId = ref(0);
const activePreviewConfig = shallowRef<PreviewConfig>(); // Kept so the commit can save it with the item.

// ── Preview Tabs ─ Tabs and their panel reference each other by id, which must be unique on the page. Below 'md' the
// tabs fold into a menu.
const elementIdPrefix = useId();
const currentPreviewTabId = ref<PreviewTabId>('table');
const previewTabMenuElement = useTemplateRef<HTMLDivElement>('previewTabMenu');
const previewTabMenuIsOpen = ref(false);

const previewIsPending = ref(false); // The preview table is empty until the engine answers, which reads as an empty item unless the wait is shown.
const previewPercentage = ref(0);
const previewMessage = ref<string>();
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

const currentPreviewTab = computed(() =>
    assertDefined(
        PREVIEW_TABS.find((previewTab) => previewTab.id === currentPreviewTabId.value),
        `Expected a preview tab with id '${currentPreviewTabId.value}'.`
    )
);

// Delimited text can be selected from any tab. Markdown and plain text only from the table tab, because opening them
// as a table is the user saying their content is data.
// TODO: Let the user override how the item is read: its format, delimiter, header row and encoding. Changing one
// re-reads the preview, and the others stay as detected. Save the choice with the item, so the audit reads the file the
// same way. Then the tabs only show the item, and Select is enabled when the format in force is delimited text, JSON or
// JSON Lines and gave at least one row, replacing the rule that markdown or plain text opened as a table is data.
const previewIsSelectable = computed(() => {
    const previewConfig = activePreviewConfig.value;
    if (previewConfig == null || previewConfig.parsedRecords.length === 0) return false;
    const isOpenedAsTable = TEXT_DATA_FORMAT_IDS.has(previewConfig.dataFormatId) && currentPreviewTabId.value === 'table';
    return TABLE_DATA_FORMAT_IDS.has(previewConfig.dataFormatId) || isOpenedAsTable;
});

const previewUnsupportedText = computed(() => t(TEXT, activePreviewConfig.value?.size === 0 ? 'item.empty.text' : 'item.unsupported.text'));

// The details tab lists only the facts there are: a listing or a preview can leave any of them out.
const itemDetails = computed(() => {
    const connectionNodeConfig = activeConnectionObjectConfig.value;
    const previewConfig = activePreviewConfig.value;
    if (connectionNodeConfig == null || previewConfig == null) return [];
    const details: { labelKey: keyof typeof TEXT; value: string | undefined }[] = [
        { labelKey: 'detail.dataFormat.label', value: t(TEXT, DATA_FORMAT_LABEL_KEYS[previewConfig.dataFormatId]) },
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
        { labelKey: 'detail.path.label', value: constructItemPath(connectionNodeConfig) }
    ];
    return details.filter((detail) => detail.value != null && detail.value !== '');
});

const connectionNodeConfigsDataSource = computed<DataSource<LocalisedConfig<ConnectionNodeConfig>>>(() => {
    const folderPath = currentFolderPath.value; // Read synchronously so this computed (and useDataWindow's cache) resets on navigation.
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- Read so Vue tracks it as a dependency.
    engineAttempt.value; // Read for the same reason: a retry has to produce a new data source for the window to refetch.
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
                engineFailure.value = raiseFailure(new AppError('Failed to list the items in this connection.', 'dpuse-app.SelectItemPanel.getRows', data, { cause: error }));
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

// Immediate, because the saved item can already be selected at mount, and its preview must still load.
watch(
    activeConnectionObjectConfig,
    async (newActiveItem) => {
        const currentRequestId = ++previewRequestId.value;
        resetPreviewState();
        if (newActiveItem == null) return;

        previewIsPending.value = true;
        try {
            const { processRequest } = await establishEngineWorker();
            if (!activeConnectionConfig.value) return;

            const options: PreviewObjectOptions = { chunkSize: undefined, extension: undefined, path: constructItemPath(newActiveItem) };
            const previewConfig = (await processRequest('previewObject', activeConnectionConfig.value, options)) as PreviewConfig;
            if (currentRequestId !== previewRequestId.value || activeConnectionObjectConfig.value !== newActiveItem) return;

            applyPreviewConfig(newActiveItem, previewConfig);
        } catch (error) {
            if (currentRequestId !== previewRequestId.value) return; // A newer selection owns the panel now.
            const data = { typeId: 'handled' };
            engineFailure.value = raiseFailure(new AppError('Failed to preview this item.', 'dpuse-app.SelectItemPanel', data, { cause: error }));
        } finally {
            if (currentRequestId === previewRequestId.value) previewIsPending.value = false; // A newer selection owns the busy state now.
        }
    },
    { immediate: true }
);

onClickOutside(previewTabMenuElement, () => {
    previewTabMenuIsOpen.value = false;
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Clearing the failure alone would show the panel again with the same empty window behind it, so the attempt count is
// bumped too: that rebuilds the data source, which is what makes the window ask for its rows a second time.
function handleRetryEngine(): void {
    engineFailure.value = undefined;
    engineAttempt.value++;
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
function handleNavigatePreviewTabs(event: KeyboardEvent, previewTabIndex: number): void {
    const lastIndex = PREVIEW_TABS.length - 1;
    const nextIndexByKey: Partial<Record<string, number>> = {
        ArrowLeft: previewTabIndex === 0 ? lastIndex : previewTabIndex - 1,
        ArrowRight: previewTabIndex === lastIndex ? 0 : previewTabIndex + 1,
        End: lastIndex,
        Home: 0
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

// Arrow keys, Home and End move through the menu. Escape closes it and returns to its button. Tab closes it and moves
// on, so focus never stays in a menu that is out of the tab order.
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
    const lastIndex = PREVIEW_TABS.length - 1;
    const nextIndexByKey: Partial<Record<string, number>> = {
        ArrowDown: previewTabIndex === lastIndex ? 0 : previewTabIndex + 1,
        ArrowUp: previewTabIndex === 0 ? lastIndex : previewTabIndex - 1,
        End: lastIndex,
        Home: 0
    };
    const nextIndex = nextIndexByKey[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    focusPreviewTabMenuItem(nextIndex);
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
        const savedDataViewConfig = await updateDataView({
            ...dataViewConfig.value,
            connectionNodeConfig: constructStorableNodeConfig(connectionNodeConfig),
            previewConfig: {
                ...previewConfig,
                dataFormatId: TABLE_DATA_FORMAT_IDS.has(previewConfig.dataFormatId) ? previewConfig.dataFormatId : 'dtv', // Markdown or plain text opened as a table was parsed as delimited text, so it is saved as that.
                text: undefined
            }, // All the parsed records are kept, so the data view panel shows the whole preview block, a few kilobytes at most. The raw text is the same block again, so it is not kept.
            contentAuditConfig: undefined,
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

// The pick is saved only when it is committed. It is reported as soon as it is made, so the summary above the step
// shows it; the later steps are cleared in what is reported, because they were worked out from the item it replaces.
function pickItem(connectionNodeConfig?: ConnectionNodeConfig): void {
    activeConnectionObjectConfig.value = connectionNodeConfig;
    if (dataViewConfig.value == null) return;
    emit('draft-changed', {
        ...dataViewConfig.value,
        connectionNodeConfig: connectionNodeConfig ? constructStorableNodeConfig(connectionNodeConfig) : undefined,
        previewConfig: undefined,
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
    const encoding = previewConfig.encodingId.toUpperCase();
    if (previewConfig.encodingConfidenceLevel == null) return t(TEXT, 'detail.encoding.assumed.text', { encoding });
    const confidence = new Intl.NumberFormat(localeId.value, { style: 'percent', maximumFractionDigits: 0 }).format(previewConfig.encodingConfidenceLevel);
    return t(TEXT, 'detail.encoding.text', { confidence, encoding });
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

function createPreviewTabElementId(previewTabId: PreviewTabId): string {
    return `${elementIdPrefix}-${previewTabId}-tab`;
}

// A file handle cannot be stored, and children are listed afresh.
function constructStorableNodeConfig(connectionNodeConfig: ConnectionNodeConfig): ConnectionNodeConfig {
    return { ...connectionNodeConfig, childNodes: [], handle: undefined };
}

function resetPreviewState(): void {
    activePreviewConfig.value = undefined;
    currentPreviewTabId.value = 'table';
    previewIsPending.value = false;
    previewPercentage.value = 0;
    previewMessage.value = undefined;
    previewTableColumnDefinitions.value = [];
    previewTableDataSource.value = {
        rowCount: 0,
        getRows: (): Promise<{ rows: Record<string, string | null>[] }> => Promise.resolve({ rows: [] })
    };
    text.value = undefined;
}

function applyPreviewConfig(connectionNodeConfig: ConnectionNodeConfig, previewConfig: PreviewConfig): void {
    activePreviewConfig.value = previewConfig;
    currentPreviewTabId.value = establishFirstPreviewTabId(previewConfig.dataFormatId);
    const previewSize = previewConfig.size ?? 0;
    const nodeSize = connectionNodeConfig.size ?? 0;
    previewPercentage.value = nodeSize > 0 ? (previewSize / nodeSize) * 100 : 0;
    if (nodeSize === 0) {
        previewMessage.value = `Previewing ${formatNumberAsStorageSize(previewSize)} (total size unknown)`;
    } else if (previewSize === nodeSize) {
        previewMessage.value = `Previewing ${formatNumberAsStorageSize(previewSize)} (entire file)`;
    } else {
        previewMessage.value = `Previewing ${formatNumberAsStorageSize(previewSize)} of ${formatNumberAsStorageSize(nodeSize)} (${formatNumberAsDecimalNumber(previewPercentage.value, 1, 0)}%)`;
    }
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

// The tab that shows the item as its format suggests: data as a table, anything else as text. Every tab stays
// available, so the user can switch to another view.
function establishFirstPreviewTabId(dataFormatId: DataFormatId): PreviewTabId {
    return TABLE_DATA_FORMAT_IDS.has(dataFormatId) ? 'table' : 'text';
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
        engineFailure.value = raiseFailure(new AppError('Failed to read this item.', 'dpuse-app.SelectItemPanel.getInfo', data, { cause: error }));
    }
}
</script>

<template>
    <ErrorNotice v-if="engineFailure" :failures="[engineFailure]" @retry="handleRetryEngine" />

    <GridDetailPanel v-else :selected-item="activeConnectionObjectConfig" :data-source="connectionNodeConfigsDataSource" :is-compact="true" max-grid-width="400px">
        <template #header="{ isSplit }">
            <div class="flex h-full min-w-0 items-center gap-x-3 border-b border-separator px-page text-sm">
                <!-- The last crumb is the item on show. It leads back to the list, so it stays live only while the list
                     is hidden; 'isSplit' comes from the panel below so the two cannot disagree about that. -->
                <!-- Back Button ─ Narrow screens show the preview in place of the list, so the trail gives way to
                     one button back to it. 'ml-[-3.5px]' starts the arrow, which Lucide insets 3.5px in its box, on
                     the page margin. -->
                <ActionWrapper
                    v-if="!isSplit && activeConnectionObjectConfig != null"
                    :aria-label="t(TEXT, 'back.aria', { label: backLabel })"
                    class="flex h-9.25 min-w-0 flex-1 cursor-pointer items-center gap-x-1 text-accent transition-colors hover:text-accent-hover focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                    @click="handleReturnToList"
                >
                    <ArrowLeftIcon aria-hidden="true" class="ml-[-3.5px] size-5 flex-none" :stroke-width="1.5" />
                    <span class="min-w-0 truncate">{{ backLabel }}</span>
                </ActionWrapper>
                <Breadcrumbs
                    v-else
                    class="h-9.25 min-w-0 flex-1"
                    :items="breadcrumbs"
                    :disable-last="isSplit || activeConnectionObjectConfig == null"
                    @select="handleSelectBreadcrumb"
                />

                <!-- Preview Tabs ─ Icons rather than words, to leave the breadcrumbs room. '-mr-1.5' centres the last icon
                     30px from the edge, under the assistant toggle. -->
                <div
                    v-if="activeConnectionObjectConfig && viewportIsWide"
                    :aria-label="t(TEXT, 'previewTabs.aria', { label: activeConnectionObjectConfig.label })"
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
                        class="flex h-full items-center border-y-2 border-t-transparent px-1.5 hover:state-hover active:state-press"
                        :class="previewTab.id === currentPreviewTabId ? 'border-b-accent text-accent' : 'border-b-transparent text-muted'"
                        role="tab"
                        :tabindex="previewTab.id === currentPreviewTabId ? 0 : -1"
                        :title="t(TEXT, previewTab.labelKey)"
                        @click="currentPreviewTabId = previewTab.id"
                        @keydown="handleNavigatePreviewTabs($event, previewTabIndex)"
                    >
                        <component :is="previewTab.icon" aria-hidden="true" class="size-5" :stroke-width="1.5" />
                    </ActionWrapper>
                </div>

                <!-- Preview Tab Menu ─ The tabs below 'md', showing only the current view's icon, so the breadcrumbs keep the row.
                     '-mr-3' centres the button 30px from the edge, under the assistant toggle. -->
                <div v-else-if="activeConnectionObjectConfig" ref="previewTabMenu" class="relative -mr-3 flex-none">
                    <ActionWrapper
                        :aria-controls="`${elementIdPrefix}-menu`"
                        :aria-expanded="previewTabMenuIsOpen"
                        aria-haspopup="menu"
                        :aria-label="t(TEXT, 'previewTabMenu.aria', { label: activeConnectionObjectConfig.label, view: t(TEXT, currentPreviewTab.labelKey) })"
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
                        :aria-label="t(TEXT, 'previewTabs.aria', { label: activeConnectionObjectConfig.label })"
                        class="absolute top-full right-0 z-30 mt-1 min-w-40 rounded-md border border-separator bg-surface p-1 shadow-md"
                        role="menu"
                    >
                        <ItemButton
                            v-for="(previewTab, previewTabIndex) in PREVIEW_TABS"
                            :key="previewTab.id"
                            :aria-checked="previewTab.id === currentPreviewTabId"
                            class="mt-0.5 flex items-center gap-x-2 first:mt-0"
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

        <template #detail>
            <!-- A tab panel only from 'md' up, because below it the tabs are a menu instead. -->
            <div
                :id="`${elementIdPrefix}-panel`"
                :aria-busy="previewIsPending"
                :aria-labelledby="viewportIsWide ? createPreviewTabElementId(currentPreviewTabId) : undefined"
                class="relative flex min-h-0 flex-1 flex-col"
                :role="viewportIsWide ? 'tabpanel' : undefined"
            >
                <BusyBar v-if="previewIsPending" class="mx-page" />
                <!-- The usual room after the last row, less the status bar's height: the table already ends above it. -->
                <Table
                    v-show="currentPreviewTabId === 'table'"
                    class="flex-1"
                    :column-definitions="previewTableColumnDefinitions"
                    :data-source="previewTableDataSource"
                    is-column-picker-hidden
                    scroll-area-padding-bottom="calc(var(--vertical-scroll-bottom-screen-inset) - var(--status-bar-height))"
                />
                <TextViewer v-show="currentPreviewTabId === 'text' && !previewIsMarkdown" class="flex-1" :text="text" />
                <!-- Markdown ─ Rendered only while shown, as rendering parses the whole preview. 'renderMarkdown' sanitises
                     the HTML, which comes from the file itself. -->
                <ScrollArea v-if="currentPreviewTabId === 'text' && previewIsMarkdown" class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-embedded-inset)">
                    <div class="dpuse-prose px-page py-3 text-sm" v-html="renderMarkdown(text ?? '')" />
                </ScrollArea>
                <ScrollArea v-show="currentPreviewTabId === 'details'" class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-embedded-inset)">
                    <p v-if="previewIsUnsupported" class="px-page pt-3 text-sm" role="status">{{ previewUnsupportedText }}</p>
                    <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 px-page py-3 text-sm">
                        <template v-for="detail in itemDetails" :key="detail.labelKey">
                            <dt class="text-muted">{{ t(TEXT, detail.labelKey) }}</dt>
                            <dd class="wrap-break-word">{{ detail.value }}</dd>
                        </template>
                    </dl>
                </ScrollArea>
                <!-- How much of the item the preview read, as a thin accent line along the top edge over a neutral bar. A meter
                     rather than a progress bar, because it shows a settled amount, not work under way. -->
                <div
                    :aria-label="t(TEXT, 'preview.aria')"
                    aria-valuemax="100"
                    aria-valuemin="0"
                    :aria-valuenow="Math.round(previewPercentage)"
                    :aria-valuetext="previewMessage"
                    class="relative flex h-(--status-bar-height) w-full flex-none items-center justify-center overflow-hidden border-t border-separator bg-card pt-0.75 text-xs text-muted"
                    role="meter"
                >
                    <div class="absolute top-0 left-0 h-0.75 bg-accent/40" :style="{ width: `${previewPercentage}%` }" />
                    <!-- Centred in the space below the blue line ('pt-0.75' clears its 3px), and trimmed to its letters so it is
                         centred on them rather than sitting high in its line box. -->
                    <div class="relative pl-1 [text-box:trim-both_cap_alphabetic]">{{ previewMessage }}</div>
                </div>
            </div>
        </template>

        <template #detail-action>
            <!-- Disabled until the preview arrives, because the preview is what the commit saves with the item, and while the
                 preview is not data. -->
            <PillButton :disabled="!previewIsSelectable || dataViewIsSaving" :icon="ArrowRightIcon" :label="t(TEXT, 'detail.audit.label')" @click="handleCommitDetail" />
        </template>

        <template #no-selection>
            {{ infoString }}
            <SelectPlaceholder :message="t(TEXT, `${itemSubject}.select.text`)" />
        </template>
    </GridDetailPanel>
</template>
