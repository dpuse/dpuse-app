<script setup lang="ts">
// Lists what the app keeps in this browser, beside the details of the item chosen, and removes items one at a time or
// all together. Open whether or not the user is signed in, because use without an account keeps data here too.

// ── External Dependencies & Registrations
import { ArrowBigLeftIcon } from '@lucide/vue';
import { computed, ref, shallowRef } from 'vue';
import { useAsyncState, useConfirmDialog } from '@vueuse/core';

// ── DPUse Framework
import { AppError, formatNumberAsStorageSize, formatNumberAsWholeNumber } from '@dpuse/dpuse-shared';

// ── Local Framework
import { closeStoreForRemoval } from '@/services/storeUse';
import { resetWorkspaceStoreQueries } from '@/services/workspaceStore';
import { TEXT } from './SessionDataPanel_.json';
import { viewportIsWide } from '@/state/device';
import { type AppFailure, raiseAppFailure, raiseFailure } from '@/state/errors';
import { clearBrowserStorage, clearCookies, clearLocalStorage, clearSessionStorage } from './_browserStorage';
import { forgetAllLoads, forgetStoreLoads } from '@/state/dataViewLoads';
import type { IndexedDatabaseSummary, OpfsItemSummary, OpfsItemTypeId } from './_browserStorage';
import { localeId, t } from '@/state/locale';
import { removeIndexedDatabase, removeOpfsItem, retrieveBrowserStorageSnapshot } from './_browserStorage';

// ── Static Components
import BusyBar from '@/components/ui/BusyBar.vue';
import ConfirmDialog from '@/components/ui/dialog/ConfirmDialog.vue';
import DialogHeader from '@/components/ui/dialog/DialogHeader.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import IconButton from '@/components/ui/action/IconButton.vue';
import ItemButton from '@/components/ui/action/ItemButton.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface StoredItemGroup {
    emptyText: string; // Shown when the group has no items, saying whether the browser has none or cannot have any.
    id: 'indexedDatabase' | 'keyValueStorage' | 'opfs';
    items: StoredItem[];
    label: string;
    sizeText: string | undefined; // The group's total, where the browser gives one.
}

// Cookies, local storage and session storage are one item each, with their entries listed in the details. Databases
// and OPFS items are one item each, because each can be deleted on its own.
type StoredItem =
    | { id: EntryStoreId; label: string; size: undefined; typeId: EntryStoreId }
    | { database: IndexedDatabaseSummary; id: string; label: string; size: undefined; typeId: 'indexedDatabase' }
    | { id: string; label: string; opfsItem: OpfsItemSummary; size: number | undefined; typeId: 'opfs' };

type EntryStoreId = 'cookies' | 'localStorage' | 'sessionStorage';

// A cookie or an entry of local or session storage, shown in the details.
interface StoredEntry {
    name: string;
    value: string;
}

interface Fact {
    id: string;
    label: string;
    value: string;
}

// The space used against the space allowed.
interface UsageMeter {
    share: number;
    text: string;
}

// A share of the space used, by kind of storage.
interface UsagePart {
    colorClass: string;
    id: 'duckdb' | 'indexedDatabase' | 'indexedDatabaseAndOther' | 'opfs' | 'opfsOther' | 'other' | 'sqlite';
    label: string;
    size: number;
    summaryText: string; // Its name, size and share, for hover and screen readers.
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CLEAR_LABEL_KEYS: Record<EntryStoreId, keyof typeof TEXT> = {
    cookies: 'clearCookies.label',
    localStorage: 'clearLocalStorage.label',
    sessionStorage: 'clearSessionStorage.label'
};
// The databases the investigate stores keep their records in, by each store's connector. They match the names the
// connectors give them.
const DEXIE_STORE_DATABASE_NAME = 'dpuse-store';
const DUCKDB_STORE_DATABASE_NAME = 'default';
const MINIMUM_VISIBLE_USAGE_SHARE = 0.005; // Half of one percent, about 2px of a full-width bar.
const OVERVIEW_ID = 'overview';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Snapshot ─ Read once on opening and again after every removal. The last snapshot stays on screen while the next is
// read, so the list does not flash empty.
const retrievalFailure = shallowRef<AppFailure>();
const {
    executeImmediate: refreshSnapshot,
    isLoading: snapshotIsLoading,
    state: snapshot
} = useAsyncState(retrieveBrowserStorageSnapshot, undefined, {
    onError: (error) => {
        retrievalFailure.value = raiseFailure(
            new AppError('Failed to read what is stored in this browser.', 'dpuse-app.SessionDataPanel.refreshSnapshot', undefined, { cause: error })
        );
    },
    onSuccess: () => {
        retrievalFailure.value = undefined;
    },
    resetOnExecute: false
});

const storedItemGroups = computed<StoredItemGroup[]>(() => {
    if (!snapshot.value) return [];

    const { estimate, indexedDatabases, opfsItems } = snapshot.value;
    return [
        {
            emptyText: t(TEXT, 'none.text'),
            id: 'keyValueStorage',
            items: [
                { id: 'cookies', label: t(TEXT, 'cookies.label'), size: undefined, typeId: 'cookies' },
                { id: 'localStorage', label: t(TEXT, 'localStorage.label'), size: undefined, typeId: 'localStorage' },
                { id: 'sessionStorage', label: t(TEXT, 'sessionStorage.label'), size: undefined, typeId: 'sessionStorage' }
            ],
            label: t(TEXT, 'keyValueStorage.label'),
            sizeText: undefined
        },
        {
            emptyText: t(TEXT, 'none.text'),
            id: 'indexedDatabase',
            items: indexedDatabases.map((database) => ({ database, id: `indexedDatabase:${database.name}`, label: database.name, size: undefined, typeId: 'indexedDatabase' })),
            label: t(TEXT, 'indexedDatabase.label'),
            sizeText: estimate?.indexedDatabaseUsage == null ? undefined : formatSize(estimate.indexedDatabaseUsage)
        },
        {
            emptyText: t(TEXT, opfsItems ? 'none.text' : 'unavailable.text'),
            id: 'opfs',
            items: (opfsItems ?? []).map((opfsItem) => ({ id: `opfs:${opfsItem.id}`, label: constructOpfsItemLabel(opfsItem), opfsItem, size: opfsItem.size, typeId: 'opfs' })),
            label: t(TEXT, 'fileSystem.label'),
            sizeText: opfsUsage.value == null ? undefined : formatSize(opfsUsage.value)
        }
    ];
});

const storedItems = computed(() => storedItemGroups.value.flatMap((group) => group.items));

// ── Selection ─ Until the user chooses, the overview shows where the screen has room for it beside the list. An item
// that has since been removed falls back the same way.
const selectedItemId = ref<string>();
const currentItemId = computed(() => {
    const itemId = selectedItemId.value;
    if (itemId === OVERVIEW_ID || storedItems.value.some((item) => item.id === itemId)) return itemId;
    return viewportIsWide.value ? OVERVIEW_ID : undefined;
});
const currentStoredItem = computed(() => storedItems.value.find((item) => item.id === currentItemId.value));
const currentEntries = computed<StoredEntry[]>(() => {
    switch (currentStoredItem.value?.typeId) {
        case 'cookies':
            return snapshot.value?.cookies ?? [];
        case 'localStorage':
            return (snapshot.value?.localStorageItems ?? []).map(({ key, value }) => ({ name: key, value }));
        case 'sessionStorage':
            return (snapshot.value?.sessionStorageItems ?? []).map(({ key, value }) => ({ name: key, value }));
        default:
            return [];
    }
});
const currentItemLabel = computed(() => currentStoredItem.value?.label ?? t(TEXT, 'overview.label'));

const currentFacts = computed<Fact[]>(() => {
    const item = currentStoredItem.value;
    if (!item) return constructOverviewFacts();

    switch (item.typeId) {
        case 'cookies': {
            const cookies = snapshot.value?.cookies;
            return [
                { id: 'itemCount', label: t(TEXT, 'itemCount.label'), value: cookies ? formatNumberAsWholeNumber(cookies.length, localeId.value) : t(TEXT, 'unavailable.text') }
            ];
        }
        case 'localStorage':
        case 'sessionStorage': {
            const storageItems = (item.typeId === 'localStorage' ? snapshot.value?.localStorageItems : snapshot.value?.sessionStorageItems) ?? [];
            return [
                { id: 'itemCount', label: t(TEXT, 'itemCount.label'), value: formatNumberAsWholeNumber(storageItems.length, localeId.value) },
                { id: 'size', label: t(TEXT, 'size.label'), value: formatSize(sumLocalStorageSizes(storageItems)) }
            ];
        }
        case 'indexedDatabase':
            return [
                { id: 'name', label: t(TEXT, 'name.label'), value: item.database.name },
                { id: 'version', label: t(TEXT, 'version.label'), value: formatNumberAsWholeNumber(item.database.version, localeId.value) },
                { id: 'size', label: t(TEXT, 'size.label'), value: t(TEXT, 'unknown.text') } // No browser reports the size of a single database.
            ];
        case 'opfs':
            return [
                { id: 'path', label: t(TEXT, 'path.label'), value: item.opfsItem.removalPaths.join(', ') },
                { id: 'size', label: t(TEXT, 'size.label'), value: formatSize(item.opfsItem.size) },
                { id: 'lastModified', label: t(TEXT, 'lastModified.label'), value: formatDate(item.opfsItem.lastModified) }
            ];
    }
});

// ── Usage ─ The space used is the browser's figure, which leaves out local storage and cookies. OPFS is measured here,
// from its files, so it is known in every browser. Only Chromium splits the rest, so elsewhere IndexedDB and anything
// else share one part.
const opfsUsage = computed(() => {
    const opfsItems = snapshot.value?.opfsItems;
    if (!opfsItems) return;
    return sumSizes(opfsItems.map((opfsItem) => opfsItem.size)) ?? snapshot.value?.estimate?.fileSystemUsage;
});

// OPFS split by what keeps it. Undefined when a file in any part cannot be read, because that part's size is unknown.
const opfsUsageBreakdown = computed(() => {
    const opfsItems = snapshot.value?.opfsItems ?? [];
    const sumTypeSizes = (typeIds: OpfsItemTypeId[]): number | undefined =>
        sumSizes(opfsItems.filter((opfsItem) => typeIds.includes(opfsItem.typeId)).map((opfsItem) => opfsItem.size));
    const duckdb = sumTypeSizes(['duckdbDatabase', 'duckdbTemporaryFiles']);
    const other = sumTypeSizes(['other']);
    const sqlite = sumTypeSizes(['sqlitePool']);
    return duckdb == null || other == null || sqlite == null ? undefined : { duckdb, other, sqlite };
});

const usageMeter = computed<UsageMeter | undefined>(() => {
    const { quota, usage } = snapshot.value?.estimate ?? {};
    if (quota == null || usage == null || quota <= 0) return;

    const share = Math.min(usage / quota, 1);
    return { share, text: t(TEXT, 'usage.text', { quota: formatSize(quota), share: formatShare(share), used: formatSize(usage) }) };
});

const usageParts = computed<UsagePart[]>(() => {
    const usage = snapshot.value?.estimate?.usage;
    if (usage == null || usage <= 0 || opfsUsage.value == null) return [];

    const indexedDatabaseUsage = snapshot.value?.estimate?.indexedDatabaseUsage;
    const opfsSize = Math.min(opfsUsage.value, usage);
    const breakdown = opfsUsageBreakdown.value;
    const opfsParts: Omit<UsagePart, 'summaryText'>[] = breakdown
        ? [
              { colorClass: 'bg-series-2', id: 'sqlite', label: t(TEXT, 'sqlite.label'), size: breakdown.sqlite },
              { colorClass: 'bg-series-3', id: 'duckdb', label: t(TEXT, 'duckdb.label'), size: breakdown.duckdb },
              { colorClass: 'bg-series-4', id: 'opfsOther', label: t(TEXT, 'opfsOther.label'), size: breakdown.other }
          ]
        : [{ colorClass: 'bg-series-2', id: 'opfs', label: t(TEXT, 'fileSystem.label'), size: opfsSize }];
    const parts: Omit<UsagePart, 'summaryText'>[] =
        indexedDatabaseUsage == null
            ? [{ colorClass: 'bg-series-1', id: 'indexedDatabaseAndOther', label: t(TEXT, 'indexedDatabaseAndOther.label'), size: Math.max(usage - opfsSize, 0) }, ...opfsParts]
            : [
                  { colorClass: 'bg-series-1', id: 'indexedDatabase', label: t(TEXT, 'indexedDatabase.label'), size: indexedDatabaseUsage },
                  ...opfsParts,
                  { colorClass: 'bg-series-5', id: 'other', label: t(TEXT, 'other.label'), size: Math.max(usage - indexedDatabaseUsage - opfsSize, 0) }
              ];
    const total = parts.reduce((sum, part) => sum + part.size, 0);
    return parts
        .filter((part) => part.size > 0) // A part with nothing in it draws nothing.
        .map((part) => ({ ...part, summaryText: t(TEXT, 'usagePart.text', { label: part.label, share: formatShare(part.size / total), size: formatSize(part.size) }) }));
});

// A part too thin to see is left out of the bar, but stays in the legend. Drawn, it would take the bar's rounded end.
const visibleUsageParts = computed(() => {
    const total = usageParts.value.reduce((sum, part) => sum + part.size, 0);
    return usageParts.value.filter((part) => part.size / total >= MINIMUM_VISIBLE_USAGE_SHARE);
});

const usagePartsSummaryText = computed(() => new Intl.ListFormat(localeId.value, { type: 'conjunction' }).format(usageParts.value.map((part) => part.summaryText)));

// ── Removal ─ One at a time, so a second click cannot start a removal while the list still shows what the first is
// removing.
const removalIsInProgress = ref(false);
const { cancel: cancelDelete, confirm: confirmDelete, isRevealed: deleteConfirmIsOpen, reveal: revealDeleteConfirm } = useConfirmDialog();
const {
    cancel: cancelClearLocalStorage,
    confirm: confirmClearLocalStorage,
    isRevealed: clearLocalStorageConfirmIsOpen,
    reveal: revealClearLocalStorageConfirm
} = useConfirmDialog();
const { cancel: cancelClearCookies, confirm: confirmClearCookies, isRevealed: clearCookiesConfirmIsOpen, reveal: revealClearCookiesConfirm } = useConfirmDialog();
const {
    cancel: cancelClearSessionStorage,
    confirm: confirmClearSessionStorage,
    isRevealed: clearSessionStorageConfirmIsOpen,
    reveal: revealClearSessionStorageConfirm
} = useConfirmDialog();
const { cancel: cancelClearAll, confirm: confirmClearAll, isRevealed: clearAllConfirmIsOpen, reveal: revealClearAllConfirm } = useConfirmDialog();

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleRetrySnapshot(): void {
    void refreshSnapshot();
}

function handleSelectItem(itemId: string): void {
    selectedItemId.value = itemId;
}

function handleBack(): void {
    selectedItemId.value = undefined;
}

async function handleDeleteItem(): Promise<void> {
    const item = currentStoredItem.value;
    if (!item) return;
    const { isCanceled } = await revealDeleteConfirm();
    if (isCanceled) return;

    await runRemoval('dpuse-app.SessionDataPanel.handleDeleteItem', `Failed to delete '${item.label}' from this browser.`, async () => {
        const storeConnectorId = findInvestigateStoreConnectorId(item);
        if (storeConnectorId != null) await closeStoreForRemoval(storeConnectorId); // This tab's store holds the database's files open.
        switch (item.typeId) {
            case 'cookies':
            case 'localStorage':
            case 'sessionStorage':
                break; // Cleared with their own buttons, never deleted as an item.
            case 'indexedDatabase':
                await removeIndexedDatabase(item.database.name);
                await resetWorkspaceStoreQueries(); // The database may have been a workspace store, whose work would otherwise still show.
                break;
            case 'opfs':
                await removeOpfsItem(item.opfsItem);
                break;
        }
        if (storeConnectorId != null) forgetStoreLoads(storeConnectorId); // Its records went with it, so data views ask to be loaded again.
    });
}

// Cookies, local storage and session storage each clear through their own question.
async function handleClearEntries(): Promise<void> {
    switch (currentStoredItem.value?.typeId) {
        case 'cookies':
            await handleClearCookies();
            break;
        case 'localStorage':
            await handleClearLocalStorage();
            break;
        case 'sessionStorage':
            await handleClearSessionStorage();
            break;
        default:
            break;
    }
}

async function handleClearCookies(): Promise<void> {
    const { isCanceled } = await revealClearCookiesConfirm();
    if (isCanceled) return;

    await runRemoval('dpuse-app.SessionDataPanel.handleClearCookies', 'Failed to clear cookies.', clearCookies);
}

async function handleClearLocalStorage(): Promise<void> {
    const { isCanceled } = await revealClearLocalStorageConfirm();
    if (isCanceled) return;

    await runRemoval('dpuse-app.SessionDataPanel.handleClearLocalStorage', 'Failed to clear local storage.', () => {
        clearLocalStorage();
        forgetAllLoads(); // The records of what each store holds went with it, so the loaded tables are dropped when next opened.
        return Promise.resolve();
    });
}

async function handleClearSessionStorage(): Promise<void> {
    const { isCanceled } = await revealClearSessionStorageConfirm();
    if (isCanceled) return;

    await runRemoval('dpuse-app.SessionDataPanel.handleClearSessionStorage', 'Failed to clear session storage.', () => {
        clearSessionStorage();
        return Promise.resolve();
    });
}

// The app reloads afterwards, because everything it has read since it started may now be gone.
async function handleClearAll(): Promise<void> {
    const { isCanceled } = await revealClearAllConfirm();
    if (isCanceled) return;

    await runRemoval('dpuse-app.SessionDataPanel.handleClearAll', 'Failed to remove all data from this browser.', async () => {
        await clearBrowserStorage();
        location.reload();
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function constructOverviewFacts(): Fact[] {
    const { estimate, localStorageItems, opfsItems } = snapshot.value ?? { estimate: undefined, localStorageItems: [], opfsItems: undefined };
    const freeSpace = estimate?.quota == null || estimate.usage == null ? undefined : Math.max(estimate.quota - estimate.usage, 0);
    return [
        { id: 'spaceUsed', label: t(TEXT, 'spaceUsed.label'), value: formatSize(estimate?.usage) },
        { id: 'spaceFree', label: t(TEXT, 'spaceFree.label'), value: formatSize(freeSpace) },
        { id: 'spaceAllowed', label: t(TEXT, 'spaceAllowed.label'), value: formatSize(estimate?.quota) },
        { id: 'localStorage', label: t(TEXT, 'localStorage.label'), value: formatSize(sumLocalStorageSizes(localStorageItems)) },
        { id: 'indexedDatabase', label: t(TEXT, 'indexedDatabase.label'), value: formatSize(estimate?.indexedDatabaseUsage) },
        {
            id: 'fileSystem',
            label: t(TEXT, 'fileSystem.label'),
            value: opfsItems ? formatSize(opfsUsage.value) : t(TEXT, 'unavailable.text')
        }
    ];
}

function sumLocalStorageSizes(localStorageItems: { size: number }[]): number {
    return localStorageItems.reduce((total, item) => total + item.size, 0);
}

// An item that could not be read has no size, so a total including it would be too small.
function sumSizes(sizes: (number | undefined)[]): number | undefined {
    let total = 0;
    for (const size of sizes) {
        if (size == null) return;
        total += size;
    }
    return total;
}

function formatShare(share: number): string {
    return new Intl.NumberFormat(localeId.value, { maximumFractionDigits: 1, style: 'percent' }).format(share);
}

function formatSize(size: number | undefined): string {
    return size == null ? t(TEXT, 'unknown.text') : formatNumberAsStorageSize(size, 1, localeId.value);
}

function formatDate(milliseconds: number | undefined): string {
    return milliseconds == null ? t(TEXT, 'unknown.text') : new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeStyle: 'short' }).format(milliseconds);
}

function constructOpfsItemLabel(opfsItem: OpfsItemSummary): string {
    switch (opfsItem.typeId) {
        case 'sqlitePool':
            return t(TEXT, 'sqlitePool.label');
        case 'duckdbDatabase':
            return t(TEXT, 'duckdbDatabase.label', { name: opfsItem.name });
        case 'duckdbTemporaryFiles':
            return t(TEXT, 'duckdbTemporaryFiles.label');
        case 'other':
            return opfsItem.name;
    }
}

// The store whose records an item holds, when it is the database of an investigate store. Undefined for anything else.
function findInvestigateStoreConnectorId(item: StoredItem): string | undefined {
    if (item.typeId === 'indexedDatabase') return item.database.name === DEXIE_STORE_DATABASE_NAME ? 'dpuse-connector-dexie-js' : undefined;
    if (item.typeId !== 'opfs') return undefined;
    if (item.opfsItem.typeId === 'sqlitePool') return 'dpuse-connector-sqlite-wasm';
    return item.opfsItem.typeId === 'duckdbDatabase' && item.opfsItem.name === DUCKDB_STORE_DATABASE_NAME ? 'dpuse-connector-duckdb-wasm' : undefined;
}

// Runs a removal, then reads the snapshot again, whether or not it worked, since a failure can still have removed
// some of the data.
async function runRemoval(locator: string, message: string, remove: () => Promise<void>): Promise<void> {
    removalIsInProgress.value = true;
    try {
        await remove();
    } catch (error) {
        raiseAppFailure(new AppError(message, locator, { typeId: 'handled' }, { cause: error }));
    } finally {
        removalIsInProgress.value = false;
        await refreshSnapshot();
    }
}
</script>

<template>
    <DialogHeader class="flex-none" :title="t(TEXT, 'manageData.title')" />

    <!-- Loading and Failure ─ Only before the first snapshot arrives. Later reads keep the last snapshot on
         screen. -->
    <BusyBar v-if="!snapshot && snapshotIsLoading" class="mx-4 mt-4" />
    <ErrorNotice v-else-if="!snapshot && retrievalFailure" class="m-4" :failures="[retrievalFailure]" @retry="handleRetrySnapshot" />

    <div v-else-if="snapshot" class="flex min-h-0 flex-1">
        <!-- List ─ Beside the details on a wide screen. On a narrow one it shows until an item is chosen. -->
        <div v-if="viewportIsWide || !currentItemId" class="flex min-w-0 flex-1 flex-col pl-4">
            <ScrollArea>
                <div class="flex flex-col gap-y-1 pt-3 pb-6">
                    <ItemButton
                        :aria-current="currentItemId === OVERVIEW_ID ? 'true' : undefined"
                        :is-active="currentItemId === OVERVIEW_ID && viewportIsWide"
                        @click="handleSelectItem(OVERVIEW_ID)"
                    >
                        {{ t(TEXT, 'overview.label') }}
                    </ItemButton>

                    <template v-for="group in storedItemGroups" :key="group.id">
                        <div class="mt-3 flex gap-x-3 pr-2 text-xs font-medium text-muted">
                            <span class="min-w-0 flex-1 truncate">{{ group.label }}</span>
                            <span v-if="group.sizeText" class="flex-none">{{ group.sizeText }}</span>
                        </div>
                        <p v-if="group.items.length === 0" class="px-2 text-sm text-muted">{{ group.emptyText }}</p>
                        <ItemButton
                            v-for="item in group.items"
                            :key="item.id"
                            :aria-current="currentItemId === item.id ? 'true' : undefined"
                            class="flex items-center gap-x-3"
                            :is-active="currentItemId === item.id && viewportIsWide"
                            @click="handleSelectItem(item.id)"
                        >
                            <span class="min-w-0 flex-1 truncate">{{ item.label }}</span>
                            <span v-if="item.size != null" class="flex-none text-sm text-muted">{{ formatSize(item.size) }}</span>
                        </ItemButton>
                    </template>
                </div>
            </ScrollArea>
        </div>

        <!-- Details -->
        <div v-if="currentItemId" class="flex min-w-0 flex-1 flex-col px-4">
            <div class="flex h-12 flex-none items-center gap-x-1 border-b border-separator">
                <IconButton v-if="!viewportIsWide" :accessible-label="t(TEXT, 'back.aria')" size="sm" @click="handleBack">
                    <ArrowBigLeftIcon stroke-width="1.25" />
                </IconButton>
                <span class="min-w-0 truncate">{{ currentItemLabel }}</span>
            </div>

            <ScrollArea>
                <div class="flex flex-col gap-y-5 pt-4 pb-6">
                    <!-- Usage Bars ─ The first shows how full the space allowed is. The second stretches the space used
                         across the full width, so its parts can be told apart even when the space used is a small
                         share. -->
                    <div v-if="!currentStoredItem && usageMeter" class="flex flex-col gap-y-4">
                        <div class="flex flex-col gap-y-1.5">
                            <p class="text-sm">{{ usageMeter.text }}</p>
                            <div aria-hidden="true" class="h-2 overflow-hidden rounded-full bg-series-1-track">
                                <div class="h-full rounded-full bg-series-1" :style="{ width: usageMeter.share > 0 ? `max(${usageMeter.share * 100}%, 0.5rem)` : '0' }" />
                            </div>
                        </div>

                        <div v-if="usageParts.length > 0" class="flex flex-col gap-y-1.5">
                            <p class="text-sm">{{ t(TEXT, 'usageParts.label') }}</p>
                            <!-- Each part grows in proportion to its size, so the gaps between parts take nothing from
                                 the shares. -->
                            <div :aria-label="usagePartsSummaryText" class="flex h-2 gap-0.5 overflow-hidden rounded-full" role="img">
                                <div
                                    v-for="part in visibleUsageParts"
                                    :key="part.id"
                                    class="h-full basis-0"
                                    :class="part.colorClass"
                                    :style="{ flexGrow: part.size }"
                                    :title="part.summaryText"
                                />
                            </div>
                            <ul aria-hidden="true" class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                                <li v-for="part in usageParts" :key="part.id" class="flex items-center gap-x-1.5">
                                    <span class="size-2.5 flex-none rounded-full" :class="part.colorClass" />
                                    {{ part.summaryText }}
                                </li>
                            </ul>
                        </div>
                    </div>

                    <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm">
                        <template v-for="fact in currentFacts" :key="fact.id">
                            <dt class="text-muted">{{ fact.label }}</dt>
                            <dd class="break-all">{{ fact.value }}</dd>
                        </template>
                    </dl>

                    <!-- Overview -->
                    <template v-if="!currentStoredItem">
                        <p class="text-sm text-muted">{{ t(TEXT, 'estimate.text') }}</p>
                        <div>
                            <RectangleButton :disabled="removalIsInProgress" variant="destructive" @click="handleClearAll">{{ t(TEXT, 'clearAll.label') }}</RectangleButton>
                        </div>
                    </template>

                    <!-- Cookies, Local Storage and Session Storage ─ Their entries are listed here rather than in the list,
                         and cleared together. Each value is kept as written, so long text wraps rather than being
                         reformatted. -->
                    <template v-else-if="currentStoredItem.typeId !== 'indexedDatabase' && currentStoredItem.typeId !== 'opfs'">
                        <p v-if="currentStoredItem.typeId === 'cookies'" class="text-sm text-muted">{{ t(TEXT, 'cookies.text') }}</p>
                        <p v-else-if="currentStoredItem.typeId === 'sessionStorage'" class="text-sm text-muted">{{ t(TEXT, 'sessionStorage.text') }}</p>
                        <ul v-if="currentEntries.length > 0" class="flex flex-col gap-y-3">
                            <li v-for="entry in currentEntries" :key="entry.name" class="flex flex-col gap-y-1">
                                <span class="text-sm font-medium break-all">{{ entry.name }}</span>
                                <pre class="rounded-md bg-card p-2 font-mono text-xs break-all whitespace-pre-wrap">{{ entry.value }}</pre>
                            </li>
                        </ul>
                        <div v-if="currentEntries.length > 0">
                            <RectangleButton :disabled="removalIsInProgress" variant="destructive" @click="handleClearEntries">
                                {{ t(TEXT, CLEAR_LABEL_KEYS[currentStoredItem.typeId]) }}
                            </RectangleButton>
                        </div>
                    </template>

                    <div v-else>
                        <RectangleButton :disabled="removalIsInProgress" variant="destructive" @click="handleDeleteItem">{{ t(TEXT, 'delete.label') }}</RectangleButton>
                    </div>
                </div>
            </ScrollArea>
        </div>
    </div>

    <ConfirmDialog
        :confirm-label="t(TEXT, 'delete.label')"
        :is-open="deleteConfirmIsOpen"
        :message="t(TEXT, 'delete.confirm.text', { label: currentItemLabel })"
        :title="t(TEXT, 'delete.confirm.title')"
        @cancel="cancelDelete"
        @confirm="confirmDelete"
    />
    <ConfirmDialog
        :confirm-label="t(TEXT, 'clearLocalStorage.confirm.label')"
        :is-open="clearLocalStorageConfirmIsOpen"
        :message="t(TEXT, 'clearLocalStorage.confirm.text')"
        :title="t(TEXT, 'clearLocalStorage.confirm.title')"
        @cancel="cancelClearLocalStorage"
        @confirm="confirmClearLocalStorage"
    />
    <ConfirmDialog
        :confirm-label="t(TEXT, 'clearCookies.confirm.label')"
        :is-open="clearCookiesConfirmIsOpen"
        :message="t(TEXT, 'clearCookies.confirm.text')"
        :title="t(TEXT, 'clearCookies.confirm.title')"
        @cancel="cancelClearCookies"
        @confirm="confirmClearCookies"
    />
    <ConfirmDialog
        :confirm-label="t(TEXT, 'clearSessionStorage.confirm.label')"
        :is-open="clearSessionStorageConfirmIsOpen"
        :message="t(TEXT, 'clearSessionStorage.confirm.text')"
        :title="t(TEXT, 'clearSessionStorage.confirm.title')"
        @cancel="cancelClearSessionStorage"
        @confirm="confirmClearSessionStorage"
    />
    <ConfirmDialog
        :confirm-label="t(TEXT, 'clearAll.confirm.label')"
        :is-open="clearAllConfirmIsOpen"
        :message="t(TEXT, 'clearAll.confirm.text')"
        :title="t(TEXT, 'clearAll.confirm.title')"
        @cancel="cancelClearAll"
        @confirm="confirmClearAll"
    />
</template>
