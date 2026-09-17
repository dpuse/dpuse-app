<script setup lang="ts">
// ── External Dependencies & Registrations
import { NetworkIcon } from '@lucide/vue';
import { computed, ref, useId } from 'vue';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import type { LocalisedEntity } from './_context';
import { T } from './ContextEntityList_.json';
import { t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ContextDocument from './_components/ContextDocument.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface EntityTab {
    getItems: (entity: LocalisedEntity) => { id: string; label: string }[];
    id: EntityTabId;
    labelKey: keyof typeof T;
}

type EntityTabId = 'dataItems' | 'events' | 'parents' | 'primaryMeasures';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const ENTITY_TABS: EntityTab[] = [
    {
        getItems: (entity) => (entity.parents ?? []).map((parent) => ({ id: parent.entityTypeId, label: parent.entityTypeId })), // Parents have no label of their own yet.
        id: 'parents',
        labelKey: 'parents.label'
    },
    { getItems: (entity) => entity.dataItems, id: 'dataItems', labelKey: 'dataItems.label' },
    { getItems: (entity) => entity.events.map((event) => ({ id: event.id, label: event.labelAction })), id: 'events', labelKey: 'events.label' },
    { getItems: (entity) => entity.primaryMeasures, id: 'primaryMeasures', labelKey: 'primaryMeasures.label' }
];

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { entities } = defineProps<{ entities: LocalisedEntity[] }>();

defineEmits<{ edit: [entity: LocalisedEntity]; showErdDiagram: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const elementIdPrefix = useId(); // Tabs and their panel reference each other by id, which must be unique on the page.
const expandedEntityTabId = ref<EntityTabId>('parents'); // Shared by every entity, so the same tab stays selected as they are opened in turn.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const expandedEntityTab = computed(() =>
    assertDefined(
        ENTITY_TABS.find((entityTab) => entityTab.id === expandedEntityTabId.value),
        `Expected an entity tab with id '${expandedEntityTabId.value}'.`
    )
);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

// Arrow keys, Home and End move between tabs and select as they go, since only the selected tab is in the tab order.
function handleNavigateEntityTabs(event: KeyboardEvent, entityTabIndex: number): void {
    const lastIndex = ENTITY_TABS.length - 1;
    const nextIndexByKey: Partial<Record<string, number>> = {
        ArrowLeft: entityTabIndex === 0 ? lastIndex : entityTabIndex - 1,
        ArrowRight: entityTabIndex === lastIndex ? 0 : entityTabIndex + 1,
        End: lastIndex,
        Home: 0
    };
    const nextIndex = nextIndexByKey[event.key];
    if (nextIndex === undefined) return;
    event.preventDefault();
    expandedEntityTabId.value = assertDefined(ENTITY_TABS[nextIndex]).id;
    const tabElements = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>('[role="tab"]');
    tabElements?.[nextIndex]?.focus();
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function createEntityTabElementId(entityId: string, entityTabId: EntityTabId): string {
    return `${elementIdPrefix}-${entityId}-${entityTabId}-tab`;
}

function createEntityTabPanelElementId(entityId: string): string {
    return `${elementIdPrefix}-${entityId}-panel`;
}
</script>

<template>
    <ContextDocument :description="t(T, 'entities.text')" :items="entities" :title="t(T, 'entities.title')" @edit="$emit('edit', $event)">
        <template #titleActions>
            <ActionWrapper :aria-label="t(T, 'erdDiagram.aria')" class="mr-4" @click="$emit('showErdDiagram')">
                <NetworkIcon class="size-5" stroke-width="1.5" />
            </ActionWrapper>
        </template>

        <template #default="{ item: entity }">
            <!-- Entity Tabs -->
            <div
                :aria-label="t(T, 'entityTabs.aria', { label: entity.label })"
                class="flex flex-none items-center gap-x-3 overflow-x-auto overscroll-x-none border-b border-separator"
                role="tablist"
            >
                <template v-for="(entityTab, entityTabIndex) in ENTITY_TABS" :key="entityTab.id">
                    <ActionWrapper
                        :id="createEntityTabElementId(entity.id, entityTab.id)"
                        :aria-controls="createEntityTabPanelElementId(entity.id)"
                        :aria-selected="entityTab.id === expandedEntityTabId"
                        class="border-y-2 border-t-transparent py-1.25"
                        :class="entityTab.id === expandedEntityTabId ? 'border-b-blue-400' : 'border-b-transparent'"
                        role="tab"
                        :tabindex="entityTab.id === expandedEntityTabId ? 0 : -1"
                        @click="expandedEntityTabId = entityTab.id"
                        @keydown="handleNavigateEntityTabs($event, entityTabIndex)"
                    >
                        <div>{{ t(T, entityTab.labelKey) }}</div>
                    </ActionWrapper>
                </template>
            </div>

            <!-- Expanded Entity Tab Panel -->
            <div
                :id="createEntityTabPanelElementId(entity.id)"
                :aria-labelledby="createEntityTabElementId(entity.id, expandedEntityTabId)"
                class="py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                role="tabpanel"
                tabindex="0"
            >
                <!-- TODO: show a 'none' message from 'T' when the selected tab has no items; the panel is otherwise blank but still focusable. -->
                <div v-for="entityTabItem in expandedEntityTab.getItems(entity)" :key="entityTabItem.id">{{ entityTabItem.label }}</div>
            </div>
        </template>
    </ContextDocument>
</template>
