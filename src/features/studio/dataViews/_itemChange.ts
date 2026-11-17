// Whether a data view's item has changed in its source since the data view last read it. A data view holds one version
// of its item: its preview, audit and loaded records are all of that version. The app never reads a changed item again
// by itself. Both steps show the change, and the user refreshes the data view from it or ignores it.

// ── External Dependencies & Registrations
import { computed, type ComputedRef, type MaybeRefOrGetter, ref, type ShallowRef, shallowRef, toValue, watch } from 'vue';

// ── DPUse Framework
import type { ConnectionNodeConfig, DataViewConfig, ListNodesOptions, ListNodesResult } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructItemPath } from './dataViewSummary';
import { establishEngineWorker } from '@/services/engine';
import { findConnectionLocalisedConfig } from '@/state/configs';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// 'unknown' when the source gives no last-modified time, or no longer lists the item, so a change cannot be told.
export type ItemChangeId = 'changed' | 'unchanged' | 'unknown';

// What tells one set of columns from another: the header record, or only how many columns there are without one.
export interface ItemColumns {
    columnCount: number;
    headerValues: (string | null)[] | undefined; // Undefined for an item read without headers.
}

interface ItemChange {
    currentItemConfig: ShallowRef<ConnectionNodeConfig | undefined>; // The item as its source lists it now.
    ignoreItemChange: () => void;
    itemChangedAt: ComputedRef<number | undefined>; // When the changed item was last changed in its source.
    itemChangeId: ComputedRef<ItemChangeId | undefined>; // Undefined until the source has been checked.
    itemChangeIsShown: ComputedRef<boolean>; // The item has changed, and the user has not ignored the change.
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ITEM_CHECK_REUSE_MS = 60_000; // How long a check is reused, so moving between the steps does not list the folder again.
const LIST_PAGE_SIZE = 500; // Folders are listed a page at a time, so a large folder takes several requests.

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The changes the user chose to ignore, by data view and the item's last-modified time, so a newer change shows again.
// Kept in page memory only, because ignoring a change does not change the data view.
const ignoredItemChangeKeys = ref<string[]>([]);

// The latest check of each item, by connection and path, shared by the steps.
const itemChecks = new Map<string, { checkedAt: number; itemConfig: ConnectionNodeConfig | undefined }>();

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Checks the data view's item in its source when a step opens and whenever the data view moves to another item. A failed
// check leaves the change unknown and shows nothing, because a source that cannot be reached is reported when the item
// is read.
export function useItemChange(dataViewConfig: MaybeRefOrGetter<DataViewConfig | undefined>): ItemChange {
    const currentItemConfig = shallowRef<ConnectionNodeConfig>();
    const itemIsChecked = ref(false);
    const itemCheckId = ref(0); // Lets a newer check stop an older one that is still waiting for its folder.

    watch(
        () => {
            const config = toValue(dataViewConfig);
            const savedItemConfig = config?.connectionNodeConfig;
            return [config?.connectionId, savedItemConfig == null ? undefined : constructItemPath(savedItemConfig)] as const;
        },
        async ([connectionId]) => {
            const checkId = ++itemCheckId.value;
            currentItemConfig.value = undefined;
            itemIsChecked.value = false;
            const savedItemConfig = toValue(dataViewConfig)?.connectionNodeConfig;
            if (connectionId == null || savedItemConfig == null) return;
            const itemConfig = await findCheckedItemConfig(connectionId, savedItemConfig);
            if (checkId !== itemCheckId.value) return;
            currentItemConfig.value = itemConfig;
            itemIsChecked.value = true;
        },
        { immediate: true }
    );

    const itemChangeId = computed(() => {
        if (!itemIsChecked.value) return;
        return compareItemVersions(toValue(dataViewConfig)?.connectionNodeConfig?.lastModifiedAt, currentItemConfig.value);
    });
    const itemChangedAt = computed(() => (itemChangeId.value === 'changed' ? currentItemConfig.value?.lastModifiedAt : undefined));
    const itemChangeIsShown = computed(() => {
        const dataViewId = toValue(dataViewConfig)?.id;
        const itemConfig = currentItemConfig.value;
        return itemChangeId.value === 'changed' && dataViewId != null && itemConfig != null && !isItemChangeIgnored(dataViewId, itemConfig);
    });

    function ignoreCurrentItemChange(): void {
        const dataViewId = toValue(dataViewConfig)?.id;
        if (dataViewId != null && currentItemConfig.value != null) ignoreItemChange(dataViewId, currentItemConfig.value);
    }

    return { currentItemConfig, ignoreItemChange: ignoreCurrentItemChange, itemChangedAt, itemChangeId, itemChangeIsShown };
}

// The item as its folder lists it now. A connector has no call that returns one item's details, so the folder is listed
// until the item is found. Undefined when the folder no longer holds it.
export async function findCurrentItemConfig(connectionId: string, savedItemConfig: ConnectionNodeConfig): Promise<ConnectionNodeConfig | undefined> {
    const connectionConfig = findConnectionLocalisedConfig(connectionId);
    if (connectionConfig == null) return;
    const { processRequest } = await establishEngineWorker();
    for (let offset = 0; ; offset += LIST_PAGE_SIZE) {
        const options: ListNodesOptions = { folderPath: savedItemConfig.folderPath, limit: LIST_PAGE_SIZE, offset };
        const result = (await processRequest('listNodes', connectionConfig, options)) as ListNodesResult;
        const currentItemConfig = result.connectionNodeConfigs.find(({ name, typeId }) => typeId === 'object' && name === savedItemConfig.name);
        if (currentItemConfig != null) return currentItemConfig;
        if (result.connectionNodeConfigs.length < LIST_PAGE_SIZE || offset + LIST_PAGE_SIZE >= result.totalCount) return;
    }
}

// 'readModifiedAt' is when the item was last changed as of the version the data view read.
export function compareItemVersions(readModifiedAt: number | undefined, currentItemConfig: ConnectionNodeConfig | undefined): ItemChangeId {
    if (readModifiedAt == null || currentItemConfig?.lastModifiedAt == null) return 'unknown';
    return readModifiedAt === currentItemConfig.lastModifiedAt ? 'unchanged' : 'changed';
}

// Whether a changed item still has the columns the data view read, so its column types can be kept. Headers are compared
// value by value, as a load compares them. Without headers on either side, only the number of columns can be compared.
export function areItemColumnsUnchanged(readColumns: ItemColumns, currentColumns: ItemColumns): boolean {
    const readHeaderValues = readColumns.headerValues;
    const currentHeaderValues = currentColumns.headerValues;
    return readHeaderValues == null || currentHeaderValues == null
        ? readHeaderValues == null && currentHeaderValues == null && readColumns.columnCount === currentColumns.columnCount
        : readHeaderValues.length === currentHeaderValues.length && readHeaderValues.every((headerValue, index) => headerValue === currentHeaderValues[index]);
}

export function ignoreItemChange(dataViewId: string, currentItemConfig: ConnectionNodeConfig): void {
    ignoredItemChangeKeys.value = [...ignoredItemChangeKeys.value, constructItemChangeKey(dataViewId, currentItemConfig)];
}

export function isItemChangeIgnored(dataViewId: string, currentItemConfig: ConnectionNodeConfig): boolean {
    return ignoredItemChangeKeys.value.includes(constructItemChangeKey(dataViewId, currentItemConfig));
}

// A refresh chosen on Explore, which the item step runs once it opens, because the preview and audit are read there. It
// travels in the history entry, as a load requested from the pill does, and is cleared once taken, so going back to the
// entry does not refresh again.
export function wasItemRefreshRequested(): boolean {
    const historyState = history.state as { itemRefreshIsRequested?: boolean } | null;
    if (historyState?.itemRefreshIsRequested !== true) return false;
    history.replaceState({ ...historyState, itemRefreshIsRequested: false }, '');
    return true;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A failed check is not kept, so the next step to open tries again.
async function findCheckedItemConfig(connectionId: string, savedItemConfig: ConnectionNodeConfig): Promise<ConnectionNodeConfig | undefined> {
    const checkKey = `${connectionId}|${constructItemPath(savedItemConfig)}`;
    const itemCheck = itemChecks.get(checkKey);
    if (itemCheck != null && Date.now() - itemCheck.checkedAt < ITEM_CHECK_REUSE_MS) return itemCheck.itemConfig;
    try {
        const itemConfig = await findCurrentItemConfig(connectionId, savedItemConfig);
        itemChecks.set(checkKey, { checkedAt: Date.now(), itemConfig });
        return itemConfig;
    } catch {
        return undefined;
    }
}

function constructItemChangeKey(dataViewId: string, currentItemConfig: ConnectionNodeConfig): string {
    return `${dataViewId}|${String(currentItemConfig.lastModifiedAt)}`;
}
