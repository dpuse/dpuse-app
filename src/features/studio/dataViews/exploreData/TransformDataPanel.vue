<script setup lang="ts">
// ── External Dependencies & Registrations
import {
    CalendarClockIcon,
    CalendarIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ChevronUpIcon,
    ClockIcon,
    HashIcon,
    KeyRoundIcon,
    PlusIcon,
    SearchIcon,
    ToggleLeftIcon,
    TypeIcon,
    XIcon
} from '@lucide/vue';
import { type Component, computed, ref } from 'vue';

import { t } from '@/state/locale';
import { TEXT } from './TransformDataPanel_.json';

// ── Local Framework
import { useSelectColumnSort } from './transformData/useSelectColumnSort.ts';

// ── Static Components
import Pill from '@/components/ui/Pill.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface Column {
    name: string;
    type: 'id' | 'number' | 'text' | 'date' | 'time' | 'boolean' | 'dateTime';
}

interface Condition {
    id: string;
    column: string;
    op: string;
    value: string;
}

interface Query {
    select: string[];
    where: Condition[];
    groupBy: string[];
    having: Condition[];
    orderBy: { column: string; dir: 'ASC' | 'DESC' }[];
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLUMNS: Column[] = [
    { name: 'id', type: 'id' },
    { name: 'customer_id', type: 'id' },
    { name: 'amount', type: 'number' },
    { name: 'status', type: 'text' },
    { name: 'created_date', type: 'date' },
    { name: 'start_time', type: 'time' },
    { name: 'updated_at', type: 'dateTime' },
    { name: 'is_active', type: 'boolean' }
];

const OPS = ['=', '!=', '<', '<=', '>', '>=', 'LIKE', 'IS NULL', 'IS NOT NULL'] as const;

const TYPE_CHIP: Record<string, string> = {
    id: 'bg-violet-100 text-violet-800 dark:bg-violet-400/20 dark:text-violet-300 inset-ring inset-ring-violet-300/60 dark:inset-ring-violet-500/30',
    number: 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-300 inset-ring inset-ring-blue-300/60 dark:inset-ring-blue-500/30',
    text: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300 inset-ring inset-ring-emerald-300/60 dark:inset-ring-emerald-500/30',
    date: 'bg-amber-100 text-amber-800 dark:bg-amber-400/20 dark:text-amber-300 inset-ring inset-ring-amber-300/60 dark:inset-ring-amber-500/30',
    time: 'bg-sky-100 text-sky-800 dark:bg-sky-400/20 dark:text-sky-300 inset-ring inset-ring-sky-300/60 dark:inset-ring-sky-500/30',
    boolean: 'bg-rose-100 text-rose-800 dark:bg-rose-400/20 dark:text-rose-300 inset-ring inset-ring-rose-300/60 dark:inset-ring-rose-500/30',
    dateTime: 'bg-orange-100 text-orange-800 dark:bg-orange-400/20 dark:text-orange-300 inset-ring inset-ring-orange-300/60 dark:inset-ring-orange-500/30'
};
const TYPE_TEXT: Record<string, string> = {
    id: 'text-violet-700 dark:text-violet-400',
    number: 'text-blue-700 dark:text-blue-400',
    text: 'text-emerald-700 dark:text-emerald-400',
    date: 'text-amber-700 dark:text-amber-400',
    time: 'text-sky-700 dark:text-sky-300',
    boolean: 'text-rose-700 dark:text-rose-400',
    dateTime: 'text-orange-700 dark:text-orange-400'
};
const TYPE_OUTLINE: Record<string, string> = {
    id: 'text-violet-700 dark:text-violet-400 inset-ring inset-ring-violet-300/60 dark:inset-ring-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-400/10',
    number: 'text-blue-700 dark:text-blue-400 inset-ring inset-ring-blue-300/60 dark:inset-ring-blue-500/30 hover:bg-blue-50 dark:hover:bg-blue-400/10',
    text: 'text-emerald-700 dark:text-emerald-400 inset-ring inset-ring-emerald-300/60 dark:inset-ring-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-400/10',
    date: 'text-amber-700 dark:text-amber-400 inset-ring inset-ring-amber-300/60 dark:inset-ring-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-400/10',
    time: 'text-sky-700 dark:text-sky-300 inset-ring inset-ring-sky-300/60 dark:inset-ring-sky-500/30 hover:bg-sky-50 dark:hover:bg-sky-400/10',
    boolean: 'text-rose-700 dark:text-rose-400 inset-ring inset-ring-rose-300/60 dark:inset-ring-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-400/10',
    dateTime: 'text-orange-700 dark:text-orange-400 inset-ring inset-ring-orange-300/60 dark:inset-ring-orange-500/30 hover:bg-orange-50 dark:hover:bg-orange-400/10'
};
const TYPE_ICON: Record<string, Component> = {
    id: KeyRoundIcon,
    number: HashIcon,
    text: TypeIcon,
    date: CalendarIcon,
    time: ClockIcon,
    boolean: ToggleLeftIcon,
    dateTime: CalendarClockIcon
};

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const state: { ctr: number } = { ctr: 0 };
const uid = (): string => String(++state.ctr);

const query = ref<Query>({ select: [], where: [], groupBy: [], having: [], orderBy: [] });

const clauseOpen = ref({ select: true, where: true, groupBy: false, having: false, orderBy: true });
const pickerOpen = ref({ select: false, where: false, groupBy: false, having: false, orderBy: false });
const selectSearchOpen = ref(false);
// const sqlOpen = ref(true);

// ── Column search (open state) ────────────────────────────────────────────────
const columnSearch = ref('');

const filteredColumns = computed<Column[]>(() => {
    const q = selectSearchOpen.value ? columnSearch.value.trim().toLowerCase() : '';
    return q ? COLUMNS.filter((c) => c.name.toLowerCase().includes(q)) : COLUMNS;
});

const selectSortableValues = computed<string[]>({
    get: () => query.value.select,
    set: (next) => {
        query.value.select = [...next];
    }
});
const { bindGridElement: bindSelectGridElement, sortEnabled: selectSortEnabled } = useSelectColumnSort({
    isOpen: computed(() => clauseOpen.value.select),
    values: selectSortableValues
});

// ── Single item list driving the TransitionGroup in both states ───────────────
// Open: all filtered columns. Closed: only selected columns in drag order.
// Same key (col.name, no prefix) in both states so Vue can FLIP tiles when toggling.
const selectVisibleItems = computed<string[]>(() => {
    return clauseOpen.value.select ? filteredColumns.value.map((c) => c.name) : query.value.select;
});

function makeDraft(): { column: string; op: string; value: string } {
    return { column: COLUMNS[0].name, op: '=', value: '' };
}
const whereDraft = ref(makeDraft());
const havingDraft = ref(makeDraft());

// Helpers - Mutations  ────────────────────────────────────────────────────────────────────────────────────────────────

function openPicker(clause: keyof typeof pickerOpen.value): void {
    clauseOpen.value[clause] = true;
    pickerOpen.value[clause] = true;
}

function toggleSelectSearch(): void {
    selectSearchOpen.value = !selectSearchOpen.value;
}

function onColItemLeave(element: Element): void {
    const htmlElement = element as HTMLElement;
    const { top, left, width, height } = htmlElement.getBoundingClientRect();
    const gridRect = htmlElement.parentElement?.getBoundingClientRect();
    htmlElement.style.top = `${String(top - (gridRect?.top ?? 0))}px`;
    htmlElement.style.left = `${String(left - (gridRect?.left ?? 0))}px`;
    htmlElement.style.width = `${String(width)}px`;
    htmlElement.style.height = `${String(height)}px`;
}

function toggleSelect(name: string): void {
    const index = query.value.select.indexOf(name);
    if (index === -1) query.value.select.push(name);
    else query.value.select.splice(index, 1);
}

function toggleGroupBy(name: string): void {
    const index = query.value.groupBy.indexOf(name);
    if (index === -1) query.value.groupBy.push(name);
    else query.value.groupBy.splice(index, 1);
}

function addCondition(target: 'where' | 'having'): void {
    const draft = (target === 'where' ? whereDraft : havingDraft).value;
    query.value[target].push({ id: uid(), column: draft.column, op: draft.op, value: draft.value });
    if (target === 'where') whereDraft.value = makeDraft();
    else havingDraft.value = makeDraft();
    pickerOpen.value[target] = false;
}

function removeCondition(target: 'where' | 'having', id: string): void {
    query.value[target] = query.value[target].filter((c) => c.id !== id);
}

function toggleOrderBy(name: string): void {
    const index = query.value.orderBy.findIndex((o) => o.column === name);
    if (index === -1) query.value.orderBy.push({ column: name, dir: 'ASC' });
    else query.value.orderBy.splice(index, 1);
}

function toggleOrderDirection(name: string): void {
    const item = query.value.orderBy.find((o) => o.column === name);
    if (item) item.dir = item.dir === 'ASC' ? 'DESC' : 'ASC';
}

// ── Helpers - Styling  ───────────────────────────────────────────────────────────────────────────────────────────────

function colType(name: string): string {
    return COLUMNS.find((c) => c.name === name)?.type ?? 'text';
}
function chipClass(name: string): string {
    return TYPE_CHIP[colType(name)] ?? TYPE_CHIP.text;
}
function outlineClass(name: string): string {
    return TYPE_OUTLINE[colType(name)] ?? TYPE_OUTLINE.text;
}
function textClass(name: string): string {
    return TYPE_TEXT[colType(name)] ?? TYPE_TEXT.text;
}
function typeIcon(name: string): Component {
    return TYPE_ICON[colType(name)] ?? TypeIcon;
}

// ── Helpers - SQL Preview  ───────────────────────────────────────────────────────────────────────────────────────────

// function condSql(c: Condition): string {
//     const rhs = ['IS NULL', 'IS NOT NULL'].includes(c.op) ? '' : ` '${c.value}'`;
//     return `${c.column} ${c.op}${rhs}`;
// }

// const sql = computed((): string => {
//     const lines: string[] = [];
//     const cols = query.value.select.length > 0 ? query.value.select.join(',\n       ') : '*';
//     lines.push(`SELECT ${cols}`);
//     if (query.value.where.length > 0) lines.push(`WHERE  ${query.value.where.map((c) => condSql(c)).join('\n   AND ')}`);
//     if (query.value.groupBy.length > 0) lines.push(`GROUP BY ${query.value.groupBy.join(', ')}`);
//     if (query.value.having.length > 0) lines.push(`HAVING ${query.value.having.map((c) => condSql(c)).join('\n    AND ')}`);
//     if (query.value.orderBy.length > 0) lines.push(`ORDER BY ${query.value.orderBy.map((o) => `${o.column} ${o.dir}`).join(', ')}`);
//     return lines.join('\n');
// });
</script>

<template>
    <!-- eslint-disable vue/no-bare-strings-in-template -->
    <ScrollArea class="mx-4" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
        <!-- Columns (Select) -->
        <section class="mt-4 rounded-md border border-separator">
            <div class="flex items-center justify-between rounded-t-md border-b border-separator bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800/60">
                <span class="text-sm font-medium text-emphasis">Select Columns</span>
                <div class="flex items-center gap-1">
                    <button
                        v-if="clauseOpen.select"
                        class="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                        type="button"
                        :title="selectSearchOpen ? 'Hide search' : 'Show search'"
                        @click="toggleSelectSearch"
                    >
                        <SearchIcon class="size-4" :class="selectSearchOpen ? 'text-emphasis' : 'text-subtle'" />
                    </button>
                    <button class="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" @click="clauseOpen.select = !clauseOpen.select">
                        <ChevronUpIcon v-if="clauseOpen.select" class="size-5 text-subtle" />
                        <ChevronDownIcon v-else class="size-5 text-subtle" />
                    </button>
                </div>
            </div>

            <!-- Search: only visible when open -->
            <div v-if="clauseOpen.select && selectSearchOpen" class="border-b border-separator px-3 py-1.5">
                <div class="relative">
                    <input
                        v-model="columnSearch"
                        class="dpuse-search-input w-full rounded-sm bg-card-hover px-2 py-1.5 pr-7 text-xs text-content placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus-ring"
                        :placeholder="t(TEXT, 'searchColumns.placeholder')"
                        type="search"
                        :aria-label="t(TEXT, 'searchColumns.aria')"
                    />
                    <button
                        v-if="columnSearch.length > 0"
                        class="absolute top-1/2 right-2 flex -translate-y-1/2 items-center justify-center p-0 text-subtle hover:text-content"
                        type="button"
                        :aria-label="t(TEXT, 'clearColumnSearch.aria')"
                        @click="columnSearch = ''"
                    >
                        <XIcon class="size-4" />
                    </button>
                </div>
            </div>

            <!-- Single TransitionGroup for both states.
                 Open: scrollable fixed-height list of all columns, click to toggle.
                 Closed: auto-height, drag-to-reorder selected columns only.
                 Same key (col.name, no prefix) in both states so Vue can FLIP tiles when toggling. -->
            <div class="p-3" :class="clauseOpen.select ? 'max-h-56 overflow-y-auto' : ''">
                <TransitionGroup
                    :ref="bindSelectGridElement"
                    name="col-item"
                    tag="div"
                    class="relative grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-1"
                    @leave="onColItemLeave"
                >
                    <Pill
                        v-for="name in selectVisibleItems"
                        :key="name"
                        :name="name"
                        :sortable="selectSortEnabled"
                        :selected="query.select.includes(name)"
                        :tile-class="query.select.includes(name) ? chipClass(name) : outlineClass(name)"
                        :icon="typeIcon(name)"
                        @toggle="toggleSelect"
                    />
                    <p
                        v-if="clauseOpen.select && selectSearchOpen && columnSearch.trim().length > 0 && filteredColumns.length === 0"
                        key="__not_found"
                        class="col-span-full py-2 text-center text-xs text-subtle"
                    >
                        No columns found
                    </p>
                    <p v-if="!clauseOpen.select && selectVisibleItems.length === 0" key="__msg" class="col-span-full py-0.5 text-xs text-subtle">Displaying all columns</p>
                </TransitionGroup>
            </div>
        </section>

        <!-- Filter (Where)-->
        <section class="mt-4 rounded-md border border-separator">
            <div class="flex items-center justify-between rounded-t-md border-b border-separator bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800/60">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-emphasis">Filter Rows</span>
                    <span v-if="query.where.length === 0" class="text-xs text-subtle">optional</span>
                </div>
                <div class="flex items-center gap-1">
                    <button class="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" :title="t(TEXT, 'addCondition.label')" @click="openPicker('where')">
                        <PlusIcon class="size-4 text-muted" />
                    </button>
                    <button class="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" @click="clauseOpen.where = !clauseOpen.where">
                        <ChevronDownIcon v-if="clauseOpen.where" class="size-4 text-subtle" />
                        <ChevronRightIcon v-else class="size-4 text-subtle" />
                    </button>
                </div>
            </div>

            <div v-if="clauseOpen.where" class="p-3">
                <!-- Existing conditions -->
                <div v-if="query.where.length > 0" class="mb-3 flex flex-col gap-2">
                    <div v-for="(cond, index) in query.where" :key="cond.id" class="flex items-center gap-2 text-xs">
                        <span v-if="index > 0" class="w-7 flex-none text-right text-[10px] font-semibold text-subtle">AND</span>
                        <div class="flex flex-1 items-center gap-1.5 rounded-full bg-card-hover py-1.5 pr-1 pl-2.5">
                            <span class="font-medium" :class="textClass(cond.column)">{{ cond.column }}</span>
                            <span class="text-subtle">{{ cond.op }}</span>
                            <span v-if="!['IS NULL', 'IS NOT NULL'].includes(cond.op)" class="text-content">'{{ cond.value }}'</span>
                            <button class="ml-auto rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/15" type="button" @click="removeCondition('where', cond.id)">
                                <XIcon class="size-3 text-subtle" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Condition builder -->
                <div v-if="pickerOpen.where" class="rounded-lg border border-separator bg-card p-3">
                    <div class="flex flex-col gap-2">
                        <select
                            v-model="whereDraft.column"
                            :aria-label="t(TEXT, 'column.aria')"
                            class="h-9 w-full rounded-md border border-separator bg-white px-2 text-sm text-content dark:bg-zinc-800 dark:text-zinc-200"
                        >
                            <option v-for="col in COLUMNS" :key="col.name" :value="col.name">{{ col.name }}</option>
                        </select>
                        <select
                            v-model="whereDraft.op"
                            :aria-label="t(TEXT, 'operator.aria')"
                            class="h-9 w-full rounded-md border border-separator bg-white px-2 text-sm text-content dark:bg-zinc-800 dark:text-zinc-200"
                        >
                            <option v-for="op in OPS" :key="op" :value="op">{{ op }}</option>
                        </select>
                        <input
                            v-if="!['IS NULL', 'IS NOT NULL'].includes(whereDraft.op)"
                            v-model="whereDraft.value"
                            :aria-label="t(TEXT, 'value.aria')"
                            class="h-9 w-full rounded-md border border-separator bg-white px-3 text-sm text-content dark:bg-zinc-800 dark:text-zinc-200"
                            :placeholder="t(TEXT, 'value.placeholder')"
                            type="text"
                        />
                    </div>
                    <div class="mt-3 flex justify-end gap-2">
                        <button class="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-zinc-100 dark:hover:bg-zinc-700" type="button" @click="pickerOpen.where = false">
                            Cancel
                        </button>
                        <button class="rounded-md bg-info px-3 py-1.5 text-sm text-info-text hover:bg-info-hover" type="button" @click="addCondition('where')">
                            Add condition
                        </button>
                    </div>
                </div>

                <span v-if="query.where.length === 0 && !pickerOpen.where" class="text-xs text-subtle"> No filter — use + to add a condition </span>
            </div>

            <!-- Collapsed summary -->
            <div v-else-if="query.where.length > 0" class="flex flex-col gap-1 px-3 py-2">
                <div v-for="(cond, index) in query.where" :key="cond.id" class="flex items-center gap-1.5 text-xs">
                    <span v-if="index > 0" class="text-[10px] font-semibold text-subtle">AND</span>
                    <span class="font-medium" :class="textClass(cond.column)">{{ cond.column }}</span>
                    <span class="text-subtle">{{ cond.op }}</span>
                    <span v-if="!['IS NULL', 'IS NOT NULL'].includes(cond.op)" class="text-content">'{{ cond.value }}'</span>
                </div>
            </div>
        </section>

        <!-- Group (Group By) -->
        <section class="mt-4 rounded-md border border-separator">
            <div class="flex items-center justify-between rounded-t-md border-b border-separator bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800/60">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-emphasis">Group Rows</span>
                    <span v-if="query.groupBy.length === 0" class="text-xs text-subtle">optional</span>
                </div>
                <div class="flex items-center gap-1">
                    <button class="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" :title="t(TEXT, 'addGrouping.label')" @click="openPicker('groupBy')">
                        <PlusIcon class="size-4 text-muted" />
                    </button>
                    <button class="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" @click="clauseOpen.groupBy = !clauseOpen.groupBy">
                        <ChevronDownIcon v-if="clauseOpen.groupBy" class="size-4 text-subtle" />
                        <ChevronRightIcon v-else class="size-4 text-subtle" />
                    </button>
                </div>
            </div>

            <div v-if="clauseOpen.groupBy" class="p-3">
                <!-- Existing chips -->
                <div class="flex flex-wrap gap-2">
                    <span v-if="query.groupBy.length === 0 && !pickerOpen.groupBy" class="text-xs text-subtle"> No grouping </span>
                    <div v-for="name in query.groupBy" :key="name" class="flex items-center gap-1 rounded-full py-1.5 pr-1 pl-2.5 text-xs select-none" :class="chipClass(name)">
                        <component :is="typeIcon(name)" class="size-3 flex-none opacity-60" />
                        <span class="font-mono">{{ name }}</span>
                        <button class="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/15" type="button" @click="toggleGroupBy(name)">
                            <XIcon class="size-3" />
                        </button>
                    </div>
                </div>

                <!-- Column picker -->
                <div v-if="pickerOpen.groupBy" class="mt-3 rounded-lg border border-separator bg-card p-3">
                    <div class="grid grid-cols-2 gap-0.5">
                        <label
                            v-for="col in COLUMNS"
                            :key="col.name"
                            class="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            :class="query.groupBy.includes(col.name) ? chipClass(col.name) : ''"
                        >
                            <input
                                type="checkbox"
                                :checked="query.groupBy.includes(col.name)"
                                :aria-label="t(TEXT, 'groupByColumn.aria')"
                                class="size-4 flex-none cursor-pointer rounded accent-blue-500"
                                @change="toggleGroupBy(col.name)"
                            />
                            <component :is="TYPE_ICON[col.type]" class="size-3 flex-none opacity-50" />
                            <span class="text-xs">{{ col.name }}</span>
                        </label>
                    </div>
                    <div class="mt-3 flex justify-end">
                        <button
                            class="rounded-md bg-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                            type="button"
                            @click="pickerOpen.groupBy = false"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>

            <!-- Collapsed summary -->
            <div v-else class="flex flex-wrap gap-1.5 px-3 py-2">
                <span v-if="query.groupBy.length === 0" class="text-xs text-subtle">—</span>
                <span v-for="name in query.groupBy" :key="name" class="rounded px-1.5 py-0.5 text-[11px]" :class="chipClass(name)">{{ name }}</span>
            </div>
        </section>

        <!-- Group Filter (Having) -->
        <section class="mt-4 rounded-md border border-separator">
            <div class="flex items-center justify-between rounded-t-md border-b border-separator bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800/60">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-emphasis">Filter Row Groups</span>
                    <span v-if="query.having.length === 0" class="text-xs text-subtle">optional</span>
                </div>
                <div class="flex items-center gap-1">
                    <button class="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" :title="t(TEXT, 'addHavingCondition.label')" @click="openPicker('having')">
                        <PlusIcon class="size-4 text-muted" />
                    </button>
                    <button class="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" @click="clauseOpen.having = !clauseOpen.having">
                        <ChevronDownIcon v-if="clauseOpen.having" class="size-4 text-subtle" />
                        <ChevronRightIcon v-else class="size-4 text-subtle" />
                    </button>
                </div>
            </div>

            <div v-if="clauseOpen.having" class="p-3">
                <!-- Existing conditions -->
                <div v-if="query.having.length > 0" class="mb-3 flex flex-col gap-2">
                    <div v-for="(cond, index) in query.having" :key="cond.id" class="flex items-center gap-2 text-xs">
                        <span v-if="index > 0" class="w-7 flex-none text-right text-[10px] font-semibold text-subtle">AND</span>
                        <div class="flex flex-1 items-center gap-1.5 rounded-full bg-card-hover py-1.5 pr-1 pl-2.5">
                            <span class="font-medium" :class="textClass(cond.column)">{{ cond.column }}</span>
                            <span class="text-subtle">{{ cond.op }}</span>
                            <span v-if="!['IS NULL', 'IS NOT NULL'].includes(cond.op)" class="text-content">'{{ cond.value }}'</span>
                            <button class="ml-auto rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/15" type="button" @click="removeCondition('having', cond.id)">
                                <XIcon class="size-3 text-subtle" />
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Condition builder -->
                <div v-if="pickerOpen.having" class="rounded-lg border border-separator bg-card p-3">
                    <div class="flex flex-col gap-2">
                        <select
                            v-model="havingDraft.column"
                            :aria-label="t(TEXT, 'column.aria')"
                            class="h-9 w-full rounded-md border border-separator bg-white px-2 text-sm text-content dark:bg-zinc-800 dark:text-zinc-200"
                        >
                            <option v-for="col in COLUMNS" :key="col.name" :value="col.name">{{ col.name }}</option>
                        </select>
                        <select
                            v-model="havingDraft.op"
                            :aria-label="t(TEXT, 'operator.aria')"
                            class="h-9 w-full rounded-md border border-separator bg-white px-2 text-sm text-content dark:bg-zinc-800 dark:text-zinc-200"
                        >
                            <option v-for="op in OPS" :key="op" :value="op">{{ op }}</option>
                        </select>
                        <input
                            v-if="!['IS NULL', 'IS NOT NULL'].includes(havingDraft.op)"
                            v-model="havingDraft.value"
                            :aria-label="t(TEXT, 'value.aria')"
                            class="h-9 w-full rounded-md border border-separator bg-white px-3 text-sm text-content dark:bg-zinc-800 dark:text-zinc-200"
                            :placeholder="t(TEXT, 'value.placeholder')"
                            type="text"
                        />
                    </div>
                    <div class="mt-3 flex justify-end gap-2">
                        <button class="rounded-md px-3 py-1.5 text-sm text-muted hover:bg-zinc-100 dark:hover:bg-zinc-700" type="button" @click="pickerOpen.having = false">
                            Cancel
                        </button>
                        <button class="rounded-md bg-info px-3 py-1.5 text-sm text-info-text hover:bg-info-hover" type="button" @click="addCondition('having')">
                            Add condition
                        </button>
                    </div>
                </div>

                <span v-if="query.having.length === 0 && !pickerOpen.having" class="text-xs text-subtle"> No filter — use + to add a condition </span>
            </div>

            <!-- Collapsed summary -->
            <div v-else-if="query.having.length > 0" class="flex flex-col gap-1 px-3 py-2">
                <div v-for="(cond, index) in query.having" :key="cond.id" class="flex items-center gap-1.5 text-xs">
                    <span v-if="index > 0" class="text-[10px] font-semibold text-subtle">AND</span>
                    <span class="font-medium" :class="textClass(cond.column)">{{ cond.column }}</span>
                    <span class="text-subtle">{{ cond.op }}</span>
                    <span v-if="!['IS NULL', 'IS NOT NULL'].includes(cond.op)" class="text-content">'{{ cond.value }}'</span>
                </div>
            </div>
        </section>

        <!--Sort (Order By) -->
        <section class="mt-4 rounded-md border border-separator">
            <div class="flex items-center justify-between rounded-t-md border-b border-separator bg-zinc-50 px-3 py-1.5 dark:bg-zinc-800/60">
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-emphasis">Sort Rows</span>
                    <span v-if="query.orderBy.length === 0" class="text-xs text-subtle">optional</span>
                </div>
                <div class="flex items-center gap-1">
                    <button class="rounded p-1 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" :title="t(TEXT, 'addSortColumn.label')" @click="openPicker('orderBy')">
                        <PlusIcon class="size-4 text-muted" />
                    </button>
                    <button class="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" @click="clauseOpen.orderBy = !clauseOpen.orderBy">
                        <ChevronDownIcon v-if="clauseOpen.orderBy" class="size-4 text-subtle" />
                        <ChevronRightIcon v-else class="size-4 text-subtle" />
                    </button>
                </div>
            </div>

            <div v-if="clauseOpen.orderBy" class="p-3">
                <!-- Existing order chips -->
                <div v-if="query.orderBy.length > 0" class="mb-3 flex flex-wrap gap-2">
                    <div v-for="item in query.orderBy" :key="item.column" class="flex items-center rounded-full text-xs select-none" :class="chipClass(item.column)">
                        <div class="flex items-center gap-1.5 py-1.5 pl-2.5">
                            <component :is="typeIcon(item.column)" class="size-3 flex-none opacity-60" />
                            <span class="font-mono">{{ item.column }}</span>
                        </div>
                        <button
                            class="border-l py-1.5 pr-2 pl-1.5 text-[10px] font-semibold tracking-wide hover:bg-black/10 dark:hover:bg-white/15"
                            style="border-color: color-mix(in oklab, currentColor 20%, transparent)"
                            type="button"
                            @click="toggleOrderDirection(item.column)"
                        >
                            {{ item.dir }}
                        </button>
                        <button class="py-1.5 pr-1.5 hover:bg-black/10 dark:hover:bg-white/15" type="button" @click="toggleOrderBy(item.column)">
                            <XIcon class="size-3" />
                        </button>
                    </div>
                </div>

                <!-- Column picker -->
                <div v-if="pickerOpen.orderBy" class="rounded-lg border border-separator bg-card p-3">
                    <div class="flex flex-col gap-0.5">
                        <button
                            v-for="col in COLUMNS"
                            :key="col.name"
                            class="flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
                            :class="query.orderBy.some((o) => o.column === col.name) ? chipClass(col.name) : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'"
                            type="button"
                            @click="toggleOrderBy(col.name)"
                        >
                            <component :is="TYPE_ICON[col.type]" class="size-3 flex-none opacity-50" />
                            <span class="flex-1 text-xs">{{ col.name }}</span>
                            <span v-if="query.orderBy.some((o) => o.column === col.name)" class="text-[10px] font-semibold opacity-60">{{
                                query.orderBy.find((o) => o.column === col.name)?.dir
                            }}</span>
                        </button>
                    </div>
                    <div class="mt-3 flex justify-end">
                        <button
                            class="rounded-md bg-zinc-100 px-3 py-1.5 text-sm hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                            type="button"
                            @click="pickerOpen.orderBy = false"
                        >
                            Done
                        </button>
                    </div>
                </div>

                <span v-if="query.orderBy.length === 0 && !pickerOpen.orderBy" class="text-xs text-subtle"> No sort order </span>
            </div>

            <!-- Collapsed summary -->
            <div v-else-if="query.orderBy.length > 0" class="flex flex-wrap gap-1.5 px-3 py-2">
                <span v-for="item in query.orderBy" :key="item.column" class="rounded px-1.5 py-0.5 text-[11px]" :class="chipClass(item.column)"
                    >{{ item.column }} {{ item.dir }}</span
                >
            </div>
        </section>
    </ScrollArea>

    <!-- SQL Preview -->
    <!-- <div class="border-separator flex-none border-t">
            <button
                class="border-separator flex w-full items-center gap-2 border-b px-4 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                type="button"
                @click="sqlOpen = !sqlOpen"
            >
                <ChevronDownIcon v-if="sqlOpen" class="size-4 flex-none text-subtle" />
                <ChevronRightIcon v-else class="size-4 flex-none text-subtle" />
                <span class="text-muted text-[11px] font-semibold tracking-wider uppercase">SQL Preview</span>
            </button>
            <pre v-if="sqlOpen" class="overflow-x-auto px-4 py-3 text-xs text-subtle">{{ sql }}</pre>
        </div> -->
    <!-- </div> -->
</template>

<style scoped>
/* Column grid items — TransitionGroup */
.col-item-enter-active {
    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}
.col-item-leave-active {
    position: absolute;
    transition:
        opacity 0.18s ease,
        transform 0.18s ease;
}
.col-item-enter-from,
.col-item-leave-to {
    opacity: 0;
    transform: scale(0.85);
}
/* FLIP: tiles smoothly slide to their new positions during drag */
.col-item-move {
    transition: transform 0.22s ease;
}

.select-drag-placeholder {
    opacity: 0.35;
}

.dpuse-search-input::-webkit-search-cancel-button {
    display: none;
    -webkit-appearance: none;
}
</style>
