<script setup lang="ts">
// ── External Dependencies & Registrations
import { SquarePenIcon } from '@lucide/vue';
import { useRoute } from 'vue-router';
import { computed, ref } from 'vue';

// ── DPUse Framework
import { AppError, formatNumberAsStorageSize } from '@dpuse/dpuse-shared';
import type { DataTypeId, DataViewConfig, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { activeMetaStoreConnectionConfig } from '@/state/session';
import { defineAsyncPanel } from '@/utilities/index.ts';
import { purifyText } from '@/services/useMarkedTool';
import { raiseAppFailure } from '@/state/errors';
import { TEXT } from './DataViewPanel_.json'; // TODO: 'item.title' names every kind of item until each connector says which one it provides.
import { constructItemPath, type DataViewConnection } from './dataViewSummary';
import { dataViewConfigs, saveDataViewRecord } from '@/state/dataViews';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import Dialog from '@/components/ui/dialog/Dialog.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StudioDetailPanel from '@/features/studio/_components/StudioDetailPanel.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Dynamic Components
const StudioDescriptorsPanel = defineAsyncPanel(() => import('@/features/studio/_components/StudioDescriptorsPanel.vue'), 'StudioDescriptorsPanel');

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_TYPE_LABEL_KEYS: Record<DataTypeId, string> = {
    boolean: 'dataType.boolean.label',
    numeric: 'dataType.numeric.label',
    string: 'dataType.string.label',
    temporal: 'dataType.temporal.label',
    unknown: 'dataType.unknown.label'
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { dataViewConnection, dataViewLocalisedConfig } = defineProps<{
    dataViewConnection: DataViewConnection | undefined; // Undefined until a connection is chosen.
    dataViewLocalisedConfig: LocalisedConfig<DataViewConfig>;
}>();
defineEmits<{ close: []; delete: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();

// Edit Dialog — the edits are held here while the dialog is open and saved when it closes, as the context descriptors
// are applied when theirs closes.
const editDialogIsOpen = ref(false);
const editedDescription = ref('');
const editedLabel = ref('');
const editedSubjectLabel = ref(''); // Taken when the dialog opens, so its title holds steady while the label is edited.

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Connection — the sentence is split where the connector's name goes, so the name can be a link while the sentence stays
// one translation, with the name wherever each language puts it.
const connectionTextParts = computed(() => t(TEXT, 'connection.text').split('{connector}'));

// Item
const itemPath = computed(() => (dataViewLocalisedConfig.connectionNodeConfig ? constructItemPath(dataViewLocalisedConfig.connectionNodeConfig) : undefined));

// Schema and Data — both read from the preview saved with the item. Its first record is the header row, as SelectItemPanel
// treats it.
const previewColumnLabels = computed(
    () => dataViewLocalisedConfig.previewConfig?.columnConfigs.map((config, index) => config.label[localeId.value] ?? config.label.en ?? String(index + 1)) ?? []
);
const previewRows = computed(() => dataViewLocalisedConfig.previewConfig?.parsedRecords.slice(1) ?? []);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleEditDataView(): void {
    editedDescription.value = dataViewLocalisedConfig.description;
    editedLabel.value = dataViewLocalisedConfig.label;
    editedSubjectLabel.value = dataViewLocalisedConfig.label;
    editDialogIsOpen.value = true;
}

async function handleCloseEditDialog(): Promise<void> {
    editDialogIsOpen.value = false;

    const label = editedLabel.value.trim();
    if ((label === '' || label === dataViewLocalisedConfig.label) && editedDescription.value === dataViewLocalisedConfig.description) return; // An emptied label keeps the old one, since a data view must have a name.

    const dataViewConfig = dataViewConfigs.value.find((config) => config.id === dataViewLocalisedConfig.id);
    if (!dataViewConfig) return;

    // The edits go into the entry for the current language, leaving the other translations as they were.
    try {
        await saveDataViewRecord(activeMetaStoreConnectionConfig.value, {
            ...dataViewConfig,
            label: label === '' ? dataViewConfig.label : { ...dataViewConfig.label, [localeId.value]: label },
            description: { ...dataViewConfig.description, [localeId.value]: editedDescription.value }
        });
    } catch (error) {
        // Announced rather than shown in the panel: the panel still shows the saved data view, which is still correct.
        raiseAppFailure(new AppError('Failed to save data view.', 'dpuse-app.DataViewPanel.handleCloseEditDialog', { typeId: 'handled' }, { cause: error }));
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function formatDateTime(timestamp: number): string {
    return new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp);
}
</script>

<template>
    <StudioDetailPanel data-region="DataViewPanel">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <StudioDocumentPanel
                :icon="dataViewConnection?.icon ?? dataViewLocalisedConfig.icon"
                :icon-dark="dataViewConnection?.iconDark ?? dataViewLocalisedConfig.iconDark"
                :overline="dataViewConnection?.label ?? t(TEXT, 'noConnection.label')"
                :title="dataViewLocalisedConfig.label"
                @close="$emit('close')"
            >
                <template #actions>
                    <ActionWrapper :aria-label="t(TEXT, 'edit.aria', { name: dataViewLocalisedConfig.label })" @click="handleEditDataView">
                        <SquarePenIcon aria-hidden="true" class="size-5" stroke-width="1.5" />
                    </ActionWrapper>
                </template>

                <!-- Description -->
                <div v-if="dataViewLocalisedConfig.description" v-html="purifyText(dataViewLocalisedConfig.description)" />

                <!-- One section per part of the task, in the order it is done, each documenting what that part produced. A
                     section not reached yet keeps its heading and says so in one line, so the document's shape never
                     changes. -->
                <!-- Titled with the connection's own name, because one connector can have several connections; the tags
                     and the line below describe its connector. -->
                <StudioDocumentSection :title="dataViewConnection ? t(TEXT, 'connection.named.title', { name: dataViewConnection.label }) : t(TEXT, 'connection.title')">
                    <template v-if="dataViewConnection">
                        <div class="mb-3 flex flex-wrap gap-1.5">
                            <Tag :text="dataViewConnection.categoryLabel" />
                            <Tag :text="`v${dataViewConnection.version}`" />
                            <!-- General availability has no label, so shows no tag. -->
                            <Tag v-if="dataViewConnection.status?.label" :color="dataViewConnection.status.color" :text="dataViewConnection.status.label" />
                        </div>
                        <p>
                            {{ connectionTextParts[0]
                            }}<RouterLink :to="{ name: 'connectors', params: { id: dataViewConnection.connectorId }, query: route.query }">{{
                                dataViewConnection.connectorLabel
                            }}</RouterLink
                            >{{ connectionTextParts[1] }}
                        </p>
                    </template>
                    <p v-else-if="dataViewLocalisedConfig.connectionId" class="text-muted">{{ t(TEXT, 'connection.unavailable.text') }}</p>
                    <p v-else class="text-muted">{{ t(TEXT, 'connection.pending.text') }}</p>
                </StudioDocumentSection>

                <StudioDocumentSection :title="t(TEXT, 'item.title')">
                    <dl v-if="dataViewLocalisedConfig.connectionNodeConfig" class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                        <dt class="text-muted">{{ t(TEXT, 'item.name.label') }}</dt>
                        <dd class="m-0 min-w-0 wrap-break-word">{{ dataViewLocalisedConfig.connectionNodeConfig.label }}</dd>
                        <dt class="text-muted">{{ t(TEXT, 'item.path.label') }}</dt>
                        <dd class="m-0 min-w-0 wrap-break-word">{{ itemPath }}</dd>
                        <template v-if="dataViewLocalisedConfig.connectionNodeConfig.mimeType">
                            <dt class="text-muted">{{ t(TEXT, 'item.type.label') }}</dt>
                            <dd class="m-0">{{ dataViewLocalisedConfig.connectionNodeConfig.mimeType }}</dd>
                        </template>
                        <template v-if="dataViewLocalisedConfig.connectionNodeConfig.size != null">
                            <dt class="text-muted">{{ t(TEXT, 'item.size.label') }}</dt>
                            <dd class="m-0">{{ formatNumberAsStorageSize(dataViewLocalisedConfig.connectionNodeConfig.size) }}</dd>
                        </template>
                        <template v-if="dataViewLocalisedConfig.connectionNodeConfig.lastModifiedAt != null">
                            <dt class="text-muted">{{ t(TEXT, 'item.lastModified.label') }}</dt>
                            <dd class="m-0">{{ formatDateTime(dataViewLocalisedConfig.connectionNodeConfig.lastModifiedAt) }}</dd>
                        </template>
                    </dl>
                    <p v-else class="text-muted">{{ t(TEXT, 'item.pending.text') }}</p>
                </StudioDocumentSection>

                <StudioDocumentSection :title="t(TEXT, 'schema.title')">
                    <div v-if="dataViewLocalisedConfig.previewConfig" class="overflow-x-auto overscroll-x-none">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="border-b border-separator text-left text-muted">
                                    <th class="py-1 pr-4 font-normal">{{ t(TEXT, 'schema.column.label') }}</th>
                                    <th class="py-1 font-normal">{{ t(TEXT, 'schema.dataType.label') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(columnConfig, index) in dataViewLocalisedConfig.previewConfig.columnConfigs" :key="index" class="border-b border-separator">
                                    <td class="py-1 pr-4">{{ previewColumnLabels[index] }}</td>
                                    <td class="py-1">{{ t(TEXT, DATA_TYPE_LABEL_KEYS[columnConfig.dataTypeId]) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <p v-else class="text-muted">{{ t(TEXT, 'schema.pending.text') }}</p>
                </StudioDocumentSection>

                <StudioDocumentSection :title="t(TEXT, 'data.title')">
                    <template v-if="dataViewLocalisedConfig.previewConfig">
                        <p class="text-sm text-muted">{{ t(TEXT, 'data.sample.text', { count: previewRows.length }) }}</p>
                        <!-- Scrolls sideways on its own, so a wide item does not widen the document. 'overscroll-x-none' stops a
                             swipe that reaches either end carrying on to the page, which iOS Safari otherwise drags sideways. -->
                        <div class="overflow-x-auto overscroll-x-none">
                            <table class="text-sm whitespace-nowrap">
                                <thead>
                                    <tr class="border-b border-separator text-left text-muted">
                                        <th v-for="(columnLabel, index) in previewColumnLabels" :key="index" class="py-1 pr-4 font-normal">{{ columnLabel }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(record, recordIndex) in previewRows" :key="recordIndex" class="border-b border-separator">
                                        <td v-for="(field, fieldIndex) in record" :key="fieldIndex" class="py-1 pr-4">{{ field.value }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </template>
                    <p v-else class="text-muted">{{ t(TEXT, 'data.pending.text') }}</p>
                </StudioDocumentSection>

                <!-- Last, and apart from Edit, so a destructive action is never one slip away from an everyday one. Its own
                     section so it can grow to say what deleting would affect, once other things are built on data views. -->
                <StudioDocumentSection :title="t(TEXT, 'delete.title')">
                    <p>{{ t(TEXT, 'delete.text') }}</p>
                    <RectangleButton variant="destructive" @click="$emit('delete')">{{ t(TEXT, 'delete.label') }}</RectangleButton>
                </StudioDocumentSection>
            </StudioDocumentPanel>
        </ScrollArea>

        <Dialog
            :is-open="editDialogIsOpen"
            max-width="90vw"
            min-height="90vh"
            sizing="full"
            :title="t(TEXT, 'edit.title', { name: editedSubjectLabel })"
            @close="handleCloseEditDialog"
        >
            <StudioDescriptorsPanel v-model:label="editedLabel" v-model:description="editedDescription" />
        </Dialog>
    </StudioDetailPanel>
</template>
