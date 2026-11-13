<script setup lang="ts">
// ── External Dependencies & Registrations
import { ChevronRightIcon, SheetIcon } from '@lucide/vue';
import { computed, nextTick, ref, shallowRef, useTemplateRef } from 'vue';

// ── DPUse Framework
import { AppError, formatNumberAsDecimalNumber } from '@dpuse/dpuse-shared';
import type { DataFormatId, SampleIssue, StructureEntry, StructureIndex, StructureKindId, StructureLocator, StructurePath } from '@dpuse/dpuse-shared';

// ── Local Framework
import { listItemStructureEntries } from '@/features/studio/dataViews/_dataViews';
import { raiseFailure } from '@/state/errors';
import { TEXT } from './StructureTree_.json';
import { localeId, t } from '@/state/locale';

// ── Static Components
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// One line of the tree. The tree is drawn flat, one line after another, so each line carries its own depth.
type StructureRow = StructureNodeRow | StructureNoticeRow;

interface StructureNodeRow {
    childCount: number | undefined; // For a list or an object only. Undefined when not known.
    isCandidate: boolean; // Mapped as a list of objects, which reads naturally as rows.
    isCut: boolean; // The value was cut short.
    key: string; // Unique in the tree, from the path.
    keyText: string | undefined; // An object entry's key or a list item's index. Undefined for the top of the item.
    kindId: StructureKindId | undefined; // Undefined for the top of the item until its first page is read.
    level: number;
    locator: StructureLocator | undefined; // Where the part's entries start. Undefined for a value with no entries.
    path: StructurePath;
    typeId: 'node';
    value: string | undefined;
}

// A line that is not part of the item: a page still loading, the button for the next page, a failure or a syntax issue.
interface StructureNoticeRow {
    issue?: SampleIssue;
    key: string;
    level: number;
    partKey: string;
    typeId: 'failed' | 'issue' | 'more' | 'pending';
}

// The entries of one list or object, read a page at a time.
interface StructurePart {
    entries: StructureEntry[];
    hasFailed: boolean;
    isPending: boolean;
    issues: SampleIssue[];
    locator: StructureLocator; // The page being read or last read, so a failure can be tried again.
    nextLocator: StructureLocator | undefined;
    path: StructurePath;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const PAGE_ENTRY_COUNT = 100;
const MAX_VALUE_LENGTH = 200;
const TOP_LOCATOR: StructureLocator = { endOffset: undefined, startOffset: 0, state: undefined };
const TOP_KEY = constructPathKey([]);
const CHILD_COUNT_TEXT_KEYS: Record<'list' | 'object', { one: keyof typeof TEXT; other: keyof typeof TEXT }> = {
    list: { one: 'item.one.text', other: 'item.other.text' },
    object: { one: 'key.one.text', other: 'key.other.text' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { connectionId, currentStructurePath, dataFormatId, itemLabel, itemPath, parserId, structureIndex } = defineProps<{
    connectionId: string;
    currentStructurePath: StructurePath | undefined; // The part read as the table now.
    dataFormatId: DataFormatId;
    itemLabel: string;
    itemPath: string;
    parserId: string | undefined;
    structureIndex: StructureIndex | undefined; // What the preview mapped. Undefined for a saved item, which opens without a preview.
}>();

const emit = defineEmits<{ select: [structurePath: StructurePath] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const structureParts = shallowRef<Partial<Record<string, StructurePart>>>({});
const expandedPartKeys = ref(new Set<string>());
const selectedRowKey = ref(TOP_KEY);
const treeElement = useTemplateRef<HTMLUListElement>('tree');

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Index ─ The preview's map marks the parts that read as rows, and gives the top of the item its kind and size.
const indexNodesByKey = computed(() => new Map((structureIndex?.nodes ?? []).map((node) => [constructPathKey(node.path), node])));
const currentStructureKey = computed(() => (currentStructurePath == null ? undefined : constructPathKey(currentStructurePath)));

const topRow = computed<StructureNodeRow>(() => {
    const topNode = indexNodesByKey.value.get(TOP_KEY);
    const firstEntry = structureParts.value[TOP_KEY]?.entries[0];
    let kindId: StructureKindId | undefined = topNode?.kindId;
    if (kindId == null && firstEntry != null) kindId = typeof firstEntry.key === 'number' ? 'list' : 'object'; // A saved item has no map, so its first page says which.
    return {
        childCount: topNode?.isComplete === true ? topNode.childCount : undefined,
        isCandidate: topNode?.isTableCandidate === true,
        isCut: false,
        key: TOP_KEY,
        keyText: undefined,
        kindId,
        level: 1,
        locator: topNode?.locator ?? TOP_LOCATOR,
        path: [],
        typeId: 'node',
        value: undefined
    };
});

const structureRows = computed(() => {
    const rows: StructureRow[] = [topRow.value];
    if (expandedPartKeys.value.has(TOP_KEY)) addPartRows(rows, TOP_KEY, 2);
    return rows;
});

const selectedRow = computed(() => structureRows.value.find((row) => row.key === selectedRowKey.value));
const selectedRowIsReadable = computed(() => {
    const row = selectedRow.value;
    return row?.typeId === 'node' && isContainerKind(row.kindId) && row.key !== currentStructureKey.value;
});

// ── Initialisation ───────────────────────────────────────────────────────────────────────────────────────────────────

// The top of the item opens at once, because it holds the parts to choose from.
void expandRow(topRow.value);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSelectRow(row: StructureRow): void {
    selectedRowKey.value = row.key;
    activateRow(row);
}

function handleReadAsTable(): void {
    const row = selectedRow.value;
    if (row?.typeId === 'node' && selectedRowIsReadable.value) emit('select', row.path);
}

// Follows the WAI-ARIA tree pattern: up and down move between lines, right opens a part or moves into it, left closes it
// or moves to its parent, and Enter or Space opens, closes or acts on the line.
function handleNavigateTree(event: KeyboardEvent): void {
    const rows = structureRows.value;
    const rowIndex = rows.findIndex((row) => row.key === selectedRowKey.value);
    if (rowIndex === -1) return;
    const row = assertRow(rows[rowIndex]);
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activateRow(row);
        return;
    }
    const steps: Partial<Record<string, () => number | undefined>> = {
        ArrowDown: () => Math.min(rowIndex + 1, rows.length - 1),
        ArrowLeft: () => stepLeft(row, rowIndex),
        ArrowRight: () => stepRight(row, rowIndex),
        ArrowUp: () => Math.max(rowIndex - 1, 0),
        End: () => rows.length - 1,
        Home: () => 0
    };
    const step = steps[event.key];
    if (step == null) return;
    event.preventDefault();
    const nextRowIndex = step();
    if (nextRowIndex == null) return;
    selectedRowKey.value = assertRow(rows[nextRowIndex]).key;
    void focusSelectedRow();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Each open part's lines, then a line for each of its pages still to read, its failure and its syntax issues.
function addPartRows(rows: StructureRow[], partKey: string, level: number): void {
    const part = structureParts.value[partKey];
    if (part == null) return;
    for (const entry of part.entries) {
        const row = constructEntryRow(part.path, entry, level);
        rows.push(row);
        if (expandedPartKeys.value.has(row.key)) addPartRows(rows, row.key, level + 1);
    }
    for (const issue of part.issues) rows.push({ issue, key: `${partKey}:issue:${issue.id}:${String(issue.lineNumber)}`, level, partKey, typeId: 'issue' });
    if (part.isPending) rows.push({ key: `${partKey}:pending`, level, partKey, typeId: 'pending' });
    else if (part.hasFailed) rows.push({ key: `${partKey}:failed`, level, partKey, typeId: 'failed' });
    else if (part.nextLocator != null) rows.push({ key: `${partKey}:more`, level, partKey, typeId: 'more' });
}

function constructEntryRow(parentPath: StructurePath, entry: StructureEntry, level: number): StructureNodeRow {
    const path = [...parentPath, entry.key];
    const key = constructPathKey(path);
    return {
        childCount: entry.childCount,
        isCandidate: indexNodesByKey.value.get(key)?.isTableCandidate === true,
        isCut: entry.isValueCut,
        key,
        keyText: typeof entry.key === 'number' ? formatCount(entry.key) : entry.key,
        kindId: entry.kindId,
        level,
        locator: isContainerKind(entry.kindId) ? entry.locator : undefined,
        path,
        typeId: 'node',
        value: entry.value
    };
}

// Opens or closes a part, reads the next page, or tries a failed page again.
function activateRow(row: StructureRow): void {
    if (row.typeId === 'more') void readPartPage(row.partKey, true);
    else if (row.typeId === 'failed') void readPartPage(row.partKey, false);
    else if (row.typeId === 'node' && expandedPartKeys.value.has(row.key)) collapseRow(row);
    else if (row.typeId === 'node') void expandRow(row);
}

async function expandRow(row: StructureNodeRow): Promise<void> {
    if (row.locator == null || (row.kindId != null && !isContainerKind(row.kindId))) return;
    expandedPartKeys.value = new Set(expandedPartKeys.value).add(row.key);
    if (structureParts.value[row.key] != null) return;
    structureParts.value = {
        ...structureParts.value,
        [row.key]: { entries: [], hasFailed: false, isPending: false, issues: [], locator: row.locator, nextLocator: undefined, path: row.path }
    };
    await readPartPage(row.key, false);
}

function collapseRow(row: StructureNodeRow): void {
    const expandedKeys = new Set(expandedPartKeys.value);
    expandedKeys.delete(row.key);
    expandedPartKeys.value = expandedKeys;
}

// Reads a part's next page, or reads its last page again after a failure. A part's pages are read one at a time.
async function readPartPage(partKey: string, isNextPage: boolean): Promise<void> {
    const part = structureParts.value[partKey];
    if (part == null || part.isPending) return;
    const locator = isNextPage && part.nextLocator != null ? part.nextLocator : part.locator;
    updatePart(partKey, { hasFailed: false, isPending: true, locator });
    try {
        // Copied into plain values, because the engine worker cannot be sent a reactive proxy, such as a locator read from
        // the map in the props.
        const result = await listItemStructureEntries(connectionId, {
            dataFormatId,
            entryCount: PAGE_ENTRY_COUNT,
            locator: { endOffset: locator.endOffset, startOffset: locator.startOffset, state: locator.state },
            maxValueLength: MAX_VALUE_LENGTH,
            parserId,
            path: itemPath,
            structurePath: [...part.path]
        });
        const readPart = assertPart(structureParts.value[partKey]);
        updatePart(partKey, {
            entries: [...readPart.entries, ...result.entries],
            isPending: false,
            issues: [...readPart.issues, ...result.issues],
            nextLocator: result.nextLocator
        });
    } catch (error) {
        updatePart(partKey, { hasFailed: true, isPending: false });
        raiseFailure(new AppError('Failed to read this part of the item.', 'dpuse-app.StructureTree.readPartPage', { typeId: 'handled' }, { cause: error }));
    }
}

function updatePart(partKey: string, changes: Partial<StructurePart>): void {
    structureParts.value = { ...structureParts.value, [partKey]: { ...assertPart(structureParts.value[partKey]), ...changes } };
}

// The line to move to with the left arrow: out of an open part closes it, otherwise to the line's parent.
function stepLeft(row: StructureRow, rowIndex: number): number | undefined {
    if (row.typeId === 'node' && expandedPartKeys.value.has(row.key)) {
        collapseRow(row);
        return;
    }
    const parentIndex = structureRows.value.findLastIndex((otherRow, index) => index < rowIndex && otherRow.level === row.level - 1);
    return parentIndex === -1 ? undefined : parentIndex;
}

// The line to move to with the right arrow: a closed part opens, and an open one moves to its first line.
function stepRight(row: StructureRow, rowIndex: number): number | undefined {
    if (row.typeId !== 'node' || (!isContainerKind(row.kindId) && row.kindId != null)) return;
    if (!expandedPartKeys.value.has(row.key)) {
        void expandRow(row);
        return;
    }
    return rowIndex + 1 < structureRows.value.length ? rowIndex + 1 : undefined;
}

async function focusSelectedRow(): Promise<void> {
    await nextTick();
    const rowIndex = structureRows.value.findIndex((row) => row.key === selectedRowKey.value);
    treeElement.value?.querySelectorAll<HTMLElement>('[role="treeitem"]')[rowIndex]?.focus();
}

function constructValueText(row: StructureNodeRow): string | undefined {
    if (row.kindId === 'list' || row.kindId === 'object') {
        if (row.childCount == null) return;
        const textKeys = CHILD_COUNT_TEXT_KEYS[row.kindId];
        return t(TEXT, row.childCount === 1 ? textKeys.one : textKeys.other, { count: formatCount(row.childCount) });
    }
    if (row.kindId === 'null') return 'null';
    const cutMark = row.isCut ? '…' : '';
    return row.kindId === 'string' ? `"${row.value ?? ''}${cutMark}"` : `${row.value ?? ''}${cutMark}`;
}

function constructIssueText(issue: SampleIssue): string {
    if (issue.lineNumber == null) return issue.message;
    if (issue.columnNumber == null) return t(TEXT, 'issue.line.text', { line: formatCount(issue.lineNumber), message: issue.message });
    return t(TEXT, 'issue.lineColumn.text', { column: formatCount(issue.columnNumber), line: formatCount(issue.lineNumber), message: issue.message });
}

function isContainerKind(kindId: StructureKindId | undefined): boolean {
    return kindId === 'list' || kindId === 'object';
}

// Segments are kept apart, because a key can hold any character, including a dot.
function constructPathKey(path: StructurePath): string {
    return JSON.stringify(path);
}

function formatCount(count: number): string {
    return formatNumberAsDecimalNumber(count, 0, 0, localeId.value);
}

function assertPart(part: StructurePart | undefined): StructurePart {
    if (part == null) throw new Error('Expected a structure part.');
    return part;
}

function assertRow(row: StructureRow | undefined): StructureRow {
    if (row == null) throw new Error('Expected a structure row.');
    return row;
}
</script>

<template>
    <div class="flex min-h-0 flex-1 flex-col">
        <!-- Header ─ The button acts on the selected line, because a button inside a tree line would be nested in it. -->
        <div class="flex items-center gap-3 px-page py-2">
            <p class="min-w-0 flex-1 text-sm text-muted">{{ t(TEXT, 'intro.text') }}</p>
            <RectangleButton :disabled="!selectedRowIsReadable" variant="outline" @click="handleReadAsTable">{{ t(TEXT, 'readAsTable.label') }}</RectangleButton>
        </div>
        <ScrollArea class="flex-1">
            <!-- Tree ─ Follows the WAI-ARIA tree pattern. Focus moves between the lines, one at a time, and the tree takes the
                 keys for all of them, so a line needs no keys of its own. -->
            <!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
            <ul ref="tree" :aria-label="t(TEXT, 'tree.aria', { label: itemLabel })" class="pb-6 font-mono text-sm" role="tree" @keydown="handleNavigateTree">
                <!-- eslint-disable-next-line vuejs-accessibility/click-events-have-key-events, vuejs-accessibility/interactive-supports-focus -->
                <li
                    v-for="row in structureRows"
                    :key="row.key"
                    :aria-expanded="row.typeId === 'node' && (isContainerKind(row.kindId) || row.kindId == null) ? expandedPartKeys.has(row.key) : undefined"
                    :aria-level="row.level"
                    :aria-selected="row.key === selectedRowKey"
                    class="flex cursor-default items-center gap-1.5 py-1 pr-page -outline-offset-2"
                    :class="row.key === selectedRowKey ? 'state-selected hover:state-selected-hover' : 'hover:state-hover'"
                    role="treeitem"
                    :style="{ paddingLeft: `calc(var(--spacing-page) + ${String((row.level - 1) * 1.25)}rem)` }"
                    :tabindex="row.key === selectedRowKey ? 0 : -1"
                    @click="handleSelectRow(row)"
                >
                    <template v-if="row.typeId === 'node'">
                        <!-- Chevron ─ A blank of the same size on a value with no entries, so keys line up. -->
                        <ChevronRightIcon
                            aria-hidden="true"
                            class="size-4 flex-none text-muted transition-transform"
                            :class="[expandedPartKeys.has(row.key) ? 'rotate-90' : '', isContainerKind(row.kindId) || row.kindId == null ? '' : 'invisible']"
                            :stroke-width="1.5"
                        />
                        <span class="truncate" :class="row.keyText == null ? 'font-sans font-medium' : 'text-emphasis'">{{ row.keyText ?? t(TEXT, 'top.label') }}</span>
                        <span v-if="constructValueText(row) != null" class="min-w-0 truncate text-muted">{{ constructValueText(row) }}</span>
                        <SheetIcon v-if="row.isCandidate" :aria-label="t(TEXT, 'candidate.aria')" class="size-4 flex-none text-muted" role="img" :stroke-width="1.5" />
                        <span v-if="row.key === currentStructureKey" class="font-sans text-xs font-medium text-emphasis">{{ t(TEXT, 'current.label') }}</span>
                    </template>
                    <span v-else-if="row.typeId === 'pending'" class="pl-5.5 font-sans text-muted">{{ t(TEXT, 'pending.text') }}</span>
                    <span v-else-if="row.typeId === 'more'" class="pl-5.5 font-sans text-accent">{{ t(TEXT, 'more.label') }}</span>
                    <span v-else-if="row.typeId === 'failed'" class="pl-5.5 font-sans text-danger-text">{{ t(TEXT, 'failed.text') }}</span>
                    <span v-else-if="row.issue != null" class="pl-5.5 font-sans text-danger-text">{{ constructIssueText(row.issue) }}</span>
                </li>
            </ul>
        </ScrollArea>
    </div>
</template>
