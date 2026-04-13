<script setup lang="ts">
// External Dependencies
import { ChevronDownIcon, ChevronRightIcon, Columns3Icon, XIcon } from 'lucide-vue-next';
import { computed, ref } from 'vue';

// ── Types ─────────────────────────────────────────────────────────────────────

type ColumnExpr = { kind: 'column'; id: string; table: string; name: string };

interface Condition {
    column: ColumnExpr;
    op: string;
    value: string;
}

interface SelectQuery {
    select: ColumnExpr[];
    from: string;
    where: Condition | null;
    orderBy: Array<{ column: ColumnExpr; dir: 'ASC' | 'DESC' }>;
}

// ── Palette Data (mocked from connection) ─────────────────────────────────────

interface PaletteColumn {
    table: string;
    name: string;
    type: 'id' | 'number' | 'text' | 'date';
}

const paletteGroups: Array<{ table: string; columns: PaletteColumn[] }> = [
    {
        table: 'orders',
        columns: [
            { table: 'orders', name: 'id', type: 'id' },
            { table: 'orders', name: 'customer_id', type: 'id' },
            { table: 'orders', name: 'amount', type: 'number' },
            { table: 'orders', name: 'status', type: 'text' },
            { table: 'orders', name: 'created_at', type: 'date' }
        ]
    },
    {
        table: 'customers',
        columns: [
            { table: 'customers', name: 'id', type: 'id' },
            { table: 'customers', name: 'name', type: 'text' },
            { table: 'customers', name: 'email', type: 'text' }
        ]
    }
];

// ── Query State ───────────────────────────────────────────────────────────────

let counter = 0;
const nextId = (): string => String(++counter);

const query = ref<SelectQuery>({ select: [], from: 'orders', where: null, orderBy: [] });

const clauseOpen = ref({ select: true, where: true, orderBy: true });
const paletteOpen = ref(true);
const groupOpen = ref<Record<string, boolean>>(Object.fromEntries(paletteGroups.map((g) => [g.table, true])));
const sqlOpen = ref(true);

// ── Drag & Drop ───────────────────────────────────────────────────────────────

const OPS = ['=', '!=', '<', '<=', '>', '>=', 'LIKE', 'IS NULL', 'IS NOT NULL'] as const;

let dragging: PaletteColumn | null = null;
const dropTarget = ref<'select' | 'where' | 'orderBy' | null>(null);

function onDragStart(col: PaletteColumn, event_: DragEvent): void {
    dragging = col;
    if (event_.dataTransfer) {
        event_.dataTransfer.effectAllowed = 'copy';
        event_.dataTransfer.setData('text/plain', `${col.table}.${col.name}`);
    }
}

function onDragOver(zone: 'select' | 'where' | 'orderBy', event_: DragEvent): void {
    event_.preventDefault();
    dropTarget.value = zone;
    if (event_.dataTransfer) event_.dataTransfer.dropEffect = 'copy';
}

function onDragLeave(zone: 'select' | 'where' | 'orderBy', event_: DragEvent): void {
    if (dropTarget.value === zone && !(event_.currentTarget as Element)?.contains(event_.relatedTarget as Node | null)) {
        dropTarget.value = null;
    }
}

function onDrop(zone: 'select' | 'where' | 'orderBy', event_: DragEvent): void {
    event_.preventDefault();
    dropTarget.value = null;
    const col = dragging;
    dragging = null;
    if (!col) return;

    switch (zone) {
        case 'select': {
            if (!query.value.select.some((s) => s.table === col.table && s.name === col.name)) {
                query.value.select.push({ kind: 'column', id: nextId(), table: col.table, name: col.name });
            }
            break;
        }
        case 'where': {
            query.value.where = {
                column: { kind: 'column', id: nextId(), table: col.table, name: col.name },
                op: '=',
                value: ''
            };
            break;
        }
        case 'orderBy': {
            if (!query.value.orderBy.some((o) => o.column.table === col.table && o.column.name === col.name)) {
                query.value.orderBy.push({
                    column: { kind: 'column', id: nextId(), table: col.table, name: col.name },
                    dir: 'ASC'
                });
            }
            break;
        }
    }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

function removeSelect(id: string): void {
    query.value.select = query.value.select.filter((item) => item.id !== id);
}

function removeWhere(): void {
    query.value.where = null;
}

function removeOrderBy(table: string, name: string): void {
    query.value.orderBy = query.value.orderBy.filter((o) => !(o.column.table === table && o.column.name === name));
}

// ── Styling ───────────────────────────────────────────────────────────────────

const TABLE_STYLE: Record<string, { chip: string; dot: string; badge: string }> = {
    orders: {
        chip: 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-300 inset-ring inset-ring-blue-300/60 dark:inset-ring-blue-500/30',
        dot: 'bg-blue-400 dark:bg-blue-500',
        badge: 'bg-blue-200 dark:bg-blue-500/30 text-blue-700 dark:text-blue-400'
    },
    customers: {
        chip: 'bg-violet-100 text-violet-800 dark:bg-violet-400/20 dark:text-violet-300 inset-ring inset-ring-violet-300/60 dark:inset-ring-violet-500/30',
        dot: 'bg-violet-400 dark:bg-violet-500',
        badge: 'bg-violet-200 dark:bg-violet-500/30 text-violet-700 dark:text-violet-400'
    }
};

const TYPE_ICON: Record<string, string> = { id: '#', number: '1', text: 'A', date: '⏱' };

function chipClass(table: string): string {
    return TABLE_STYLE[table]?.chip ?? 'bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200 inset-ring inset-ring-zinc-300/50';
}
function dotClass(table: string): string {
    return TABLE_STYLE[table]?.dot ?? 'bg-zinc-400';
}
function badgeClass(table: string): string {
    return TABLE_STYLE[table]?.badge ?? 'bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300';
}

// ── SQL Preview ───────────────────────────────────────────────────────────────

const sql = computed((): string => {
    const cols = query.value.select.length > 0 ? query.value.select.map((c) => `${c.table}.${c.name}`).join(',\n       ') : '*';
    const lines = [`SELECT ${cols}`, `FROM   ${query.value.from}`];
    if (query.value.where) {
        const { column: c, op, value } = query.value.where;
        const rhs = ['IS NULL', 'IS NOT NULL'].includes(op) ? '' : ` '${value}'`;
        lines.push(`WHERE  ${c.table}.${c.name} ${op}${rhs}`);
    }
    if (query.value.orderBy.length > 0) {
        lines.push(`ORDER BY ${query.value.orderBy.map((o) => `${o.column.table}.${o.column.name} ${o.dir}`).join(', ')}`);
    }
    return lines.join('\n');
});
</script>

<template>
    <!-- eslint-disable vue/no-bare-strings-in-template -->
    <div class="flex flex-1 flex-col overflow-hidden">
        <!-- ── Main Area: Palette + Canvas ── -->
        <div class="flex flex-1 overflow-hidden">
            <!-- Palette -->
            <aside class="border-separator flex flex-none flex-col overflow-hidden border-r transition-[width] duration-200" :class="paletteOpen ? 'w-44' : 'w-10'">
                <!-- Palette Header -->
                <div class="border-separator flex flex-none items-center justify-between border-b px-2 py-2">
                    <span v-if="paletteOpen" class="text-muted truncate text-[11px] font-semibold tracking-wider uppercase"> Columns </span>
                    <button
                        class="rounded-md p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        :title="paletteOpen ? 'Collapse palette' : 'Open palette'"
                        type="button"
                        @click="paletteOpen = !paletteOpen"
                    >
                        <Columns3Icon class="size-4 text-zinc-500 dark:text-zinc-400" />
                    </button>
                </div>

                <!-- Palette Columns -->
                <div v-if="paletteOpen" class="flex-1 overflow-y-auto py-2">
                    <div v-for="group in paletteGroups" :key="group.table" class="mb-1">
                        <!-- Table toggle -->
                        <button
                            class="flex w-full items-center gap-1 px-2 py-1 text-left text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                            type="button"
                            @click="groupOpen[group.table] = !groupOpen[group.table]"
                        >
                            <ChevronDownIcon v-if="groupOpen[group.table]" class="size-3 flex-none" />
                            <ChevronRightIcon v-else class="size-3 flex-none" />
                            <span class="truncate font-mono">{{ group.table }}</span>
                        </button>

                        <!-- Column chips (draggable) -->
                        <div v-if="groupOpen[group.table]" class="flex flex-col gap-0.5 px-2 pb-1">
                            <div
                                v-for="col in group.columns"
                                :key="col.name"
                                class="flex min-h-9 cursor-grab items-center gap-1.5 rounded-md px-2 py-1.5 text-xs select-none active:cursor-grabbing"
                                :class="chipClass(col.table)"
                                draggable="true"
                                role="button"
                                tabindex="0"
                                :title="`${col.table}.${col.name}`"
                                @dragstart="onDragStart(col, $event)"
                            >
                                <span class="w-3.5 flex-none text-center font-mono text-[10px] opacity-60">{{ TYPE_ICON[col.type] }}</span>
                                <span class="truncate font-mono">{{ col.name }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Collapsed: stacked dots -->
                <div v-else class="flex flex-1 flex-col items-center gap-2 pt-3">
                    <div v-for="group in paletteGroups" :key="group.table" class="flex flex-col items-center gap-1">
                        <div v-for="col in group.columns" :key="col.name" class="size-2 rounded-full" :class="dotClass(col.table)" :title="`${col.table}.${col.name}`" />
                    </div>
                </div>
            </aside>

            <!-- Query Canvas -->
            <div class="flex-1 overflow-y-auto p-4">
                <div class="flex flex-col gap-3">
                    <!-- ── SELECT ── -->
                    <section class="border-separator overflow-hidden rounded-lg border">
                        <div class="border-separator flex items-center justify-between border-b bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                            <span class="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-200">SELECT</span>
                            <button class="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" @click="clauseOpen.select = !clauseOpen.select">
                                <ChevronDownIcon v-if="clauseOpen.select" class="size-4 text-zinc-400" />
                                <ChevronRightIcon v-else class="size-4 text-zinc-400" />
                            </button>
                        </div>

                        <div v-if="clauseOpen.select" class="p-3">
                            <div
                                class="flex min-h-13 flex-wrap items-start gap-2 rounded-md px-2 py-2 transition-colors"
                                :class="
                                    dropTarget === 'select'
                                        ? 'bg-blue-50 outline-2 -outline-offset-2 outline-blue-400 outline-dashed dark:bg-blue-400/10'
                                        : 'outline-2 -outline-offset-2 outline-zinc-200 outline-dashed dark:outline-zinc-700'
                                "
                                role="button"
                                tabindex="0"
                                @dragover="onDragOver('select', $event)"
                                @dragleave="onDragLeave('select', $event)"
                                @drop="onDrop('select', $event)"
                            >
                                <!-- Column chips -->
                                <div
                                    v-for="item in query.select"
                                    :key="item.id"
                                    class="flex items-center gap-1 rounded-full py-1.5 pr-1 pl-2.5 text-xs select-none"
                                    :class="chipClass(item.table)"
                                >
                                    <div class="size-1.5 flex-none rounded-full" :class="dotClass(item.table)" />
                                    <span class="font-mono">{{ item.table }}.{{ item.name }}</span>
                                    <button class="ml-0.5 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/15" type="button" @click="removeSelect(item.id)">
                                        <XIcon class="size-3" />
                                    </button>
                                </div>

                                <!-- Empty hint -->
                                <span
                                    v-if="query.select.length === 0"
                                    class="self-center text-xs"
                                    :class="dropTarget === 'select' ? 'text-blue-500 dark:text-blue-400' : 'text-zinc-400 dark:text-zinc-500'"
                                >
                                    {{ dropTarget === 'select' ? 'Release to add column' : 'Drag columns here — or leave empty to select all' }}
                                </span>
                            </div>
                        </div>

                        <!-- Collapsed summary -->
                        <div v-else class="flex flex-wrap gap-1.5 px-3 py-2">
                            <span v-if="query.select.length === 0" class="font-mono text-xs text-zinc-400 dark:text-zinc-500">*</span>
                            <div v-for="item in query.select" :key="item.id" class="rounded px-1.5 py-0.5 font-mono text-[11px]" :class="badgeClass(item.table)">
                                {{ item.table }}.{{ item.name }}
                            </div>
                        </div>
                    </section>

                    <!-- ── FROM ── -->
                    <section class="border-separator overflow-hidden rounded-lg border">
                        <div class="border-separator flex items-center border-b bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                            <span class="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-200">FROM</span>
                        </div>
                        <div class="p-3">
                            <div class="inline-flex items-center gap-2 rounded-md bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-700">
                                <div class="size-2 rounded-sm bg-zinc-400" />
                                <span class="font-mono text-zinc-700 dark:text-zinc-200">{{ query.from }}</span>
                            </div>
                        </div>
                    </section>

                    <!-- ── WHERE ── -->
                    <section class="border-separator overflow-hidden rounded-lg border">
                        <div class="border-separator flex items-center justify-between border-b bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-200">WHERE</span>
                                <span v-if="!query.where" class="text-xs text-zinc-400 dark:text-zinc-500">optional</span>
                            </div>
                            <div class="flex items-center gap-1">
                                <button
                                    v-if="query.where"
                                    class="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                                    title="Clear condition"
                                    type="button"
                                    @click="removeWhere"
                                >
                                    <XIcon class="size-4 text-zinc-400" />
                                </button>
                                <button class="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" @click="clauseOpen.where = !clauseOpen.where">
                                    <ChevronDownIcon v-if="clauseOpen.where" class="size-4 text-zinc-400" />
                                    <ChevronRightIcon v-else class="size-4 text-zinc-400" />
                                </button>
                            </div>
                        </div>

                        <div v-if="clauseOpen.where" class="p-3">
                            <!-- Condition editor -->
                            <div v-if="query.where" class="flex flex-wrap items-center gap-2">
                                <div class="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs select-none" :class="chipClass(query.where.column.table)">
                                    <div class="size-1.5 flex-none rounded-full" :class="dotClass(query.where.column.table)" />
                                    <span class="font-mono">{{ query.where.column.table }}.{{ query.where.column.name }}</span>
                                </div>

                                <select
                                    v-model="query.where.op"
                                    aria-label="Comparison operator"
                                    class="border-separator h-9 rounded-md border bg-white px-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                >
                                    <option v-for="op in OPS" :key="op" :value="op">{{ op }}</option>
                                </select>

                                <input
                                    v-if="!['IS NULL', 'IS NOT NULL'].includes(query.where.op)"
                                    v-model="query.where.value"
                                    aria-label="Filter value"
                                    class="border-separator h-9 w-36 rounded-md border bg-white px-3 font-mono text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                    placeholder="value…"
                                    type="text"
                                />
                            </div>

                            <!-- Drop zone when empty -->
                            <div
                                v-else
                                class="flex min-h-13 items-center justify-center rounded-md border-2 border-dashed text-sm transition-colors"
                                :class="
                                    dropTarget === 'where'
                                        ? 'border-blue-400 bg-blue-50 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400'
                                        : 'border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500'
                                "
                                role="button"
                                tabindex="0"
                                @dragover="onDragOver('where', $event)"
                                @dragleave="onDragLeave('where', $event)"
                                @drop="onDrop('where', $event)"
                            >
                                {{ dropTarget === 'where' ? 'Release to add condition' : 'Drag a column here to filter' }}
                            </div>
                        </div>

                        <!-- Collapsed summary -->
                        <div v-else-if="query.where" class="px-3 py-2">
                            <span class="rounded px-1.5 py-0.5 font-mono text-[11px]" :class="badgeClass(query.where.column.table)">
                                {{ query.where.column.table }}.{{ query.where.column.name }}
                            </span>
                            <span class="mx-1 text-xs text-zinc-400">{{ query.where.op }}</span>
                            <span v-if="!['IS NULL', 'IS NOT NULL'].includes(query.where.op)" class="font-mono text-xs text-zinc-600 dark:text-zinc-400"
                                >'{{ query.where.value }}'</span
                            >
                        </div>
                    </section>

                    <!-- ── ORDER BY ── -->
                    <section class="border-separator overflow-hidden rounded-lg border">
                        <div class="border-separator flex items-center justify-between border-b bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
                            <div class="flex items-center gap-2">
                                <span class="font-mono text-sm font-semibold text-zinc-700 dark:text-zinc-200">ORDER BY</span>
                                <span v-if="query.orderBy.length === 0" class="text-xs text-zinc-400 dark:text-zinc-500">optional</span>
                            </div>
                            <button class="rounded p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-600" type="button" @click="clauseOpen.orderBy = !clauseOpen.orderBy">
                                <ChevronDownIcon v-if="clauseOpen.orderBy" class="size-4 text-zinc-400" />
                                <ChevronRightIcon v-else class="size-4 text-zinc-400" />
                            </button>
                        </div>

                        <div v-if="clauseOpen.orderBy" class="p-3">
                            <!-- Existing sort items -->
                            <div v-if="query.orderBy.length > 0" class="mb-2 flex flex-wrap gap-2">
                                <div
                                    v-for="item in query.orderBy"
                                    :key="`${item.column.table}.${item.column.name}`"
                                    class="flex items-center overflow-hidden rounded-full text-xs select-none"
                                    :class="chipClass(item.column.table)"
                                >
                                    <div class="flex items-center gap-1.5 py-1.5 pl-2.5">
                                        <div class="size-1.5 flex-none rounded-full" :class="dotClass(item.column.table)" />
                                        <span class="font-mono">{{ item.column.table }}.{{ item.column.name }}</span>
                                    </div>
                                    <select
                                        v-model="item.dir"
                                        aria-label="Sort direction"
                                        class="h-full cursor-pointer bg-transparent py-1.5 pr-1 pl-1.5 text-xs"
                                        style="border-left: 1px solid color-mix(in oklab, currentColor 20%, transparent)"
                                    >
                                        <option value="ASC">ASC</option>
                                        <option value="DESC">DESC</option>
                                    </select>
                                    <button
                                        class="py-1.5 pr-1.5 hover:bg-black/10 dark:hover:bg-white/15"
                                        type="button"
                                        @click="removeOrderBy(item.column.table, item.column.name)"
                                    >
                                        <XIcon class="size-3" />
                                    </button>
                                </div>
                            </div>

                            <!-- Drop zone -->
                            <div
                                class="flex min-h-11 items-center justify-center rounded-md border-2 border-dashed text-sm transition-colors"
                                :class="
                                    dropTarget === 'orderBy'
                                        ? 'border-blue-400 bg-blue-50 text-blue-500 dark:bg-blue-400/10 dark:text-blue-400'
                                        : 'border-zinc-200 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500'
                                "
                                role="button"
                                tabindex="0"
                                @dragover="onDragOver('orderBy', $event)"
                                @dragleave="onDragLeave('orderBy', $event)"
                                @drop="onDrop('orderBy', $event)"
                            >
                                {{ dropTarget === 'orderBy' ? 'Release to sort by column' : 'Drag a column to sort' }}
                            </div>
                        </div>

                        <!-- Collapsed summary -->
                        <div v-else-if="query.orderBy.length > 0" class="flex flex-wrap gap-1.5 px-3 py-2">
                            <span
                                v-for="item in query.orderBy"
                                :key="`${item.column.table}.${item.column.name}`"
                                class="rounded px-1.5 py-0.5 font-mono text-[11px]"
                                :class="badgeClass(item.column.table)"
                                >{{ item.column.table }}.{{ item.column.name }} {{ item.dir }}</span
                            >
                        </div>
                    </section>
                </div>
            </div>
        </div>

        <!-- ── SQL Preview ── -->
        <div class="border-separator flex-none border-t">
            <button
                class="border-separator flex w-full items-center gap-2 border-b px-4 py-2 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                type="button"
                @click="sqlOpen = !sqlOpen"
            >
                <ChevronDownIcon v-if="sqlOpen" class="size-4 flex-none text-zinc-400" />
                <ChevronRightIcon v-else class="size-4 flex-none text-zinc-400" />
                <span class="text-muted text-[11px] font-semibold tracking-wider uppercase">SQL Preview</span>
            </button>
            <pre v-if="sqlOpen" class="overflow-x-auto px-4 py-3 font-mono text-xs text-zinc-600 dark:text-zinc-400">{{ sql }}</pre>
        </div>
    </div>
</template>
