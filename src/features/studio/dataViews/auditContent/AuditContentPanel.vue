<script setup lang="ts">
// ── External Dependencies & Registrations
import { ArrowRightIcon, RefreshCwIcon } from '@lucide/vue';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { DataTypeId, DataViewConfig, LocalisedConfig, ObjectColumnConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { ignoreReportedNavigationFailure } from '@/router';
import { TEXT } from './AuditContentPanel_.json';
import { abortDataViewContentAudit, auditDataViewContent, resolveDataViewIdParameter, useDataView, useUpdateDataView } from '@/features/studio/dataViews/_dataViews';
import { type AppFailure, raiseFailure } from '@/state/errors';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import BusyBar from '@/components/ui/BusyBar.vue';
import ErrorNotice from '@/components/ui/error/ErrorNotice.vue';
import PillButton from '@/components/ui/action/PillButton.vue';
import ScrollRegion from '@/components/ui/scroll/ScrollRegion.vue';
import type { TaskConfig } from '@/components/ui/TaskBar.vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface AuditDetail {
    id: string;
    labelKey: keyof typeof TEXT;
    value: string | undefined; // Undefined when the parser used did not count it, and the detail is then left out.
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const DATA_TYPE_LABEL_KEYS: Record<DataTypeId, keyof typeof TEXT> = {
    boolean: 'dataType.boolean.label',
    numeric: 'dataType.numeric.label',
    string: 'dataType.string.label',
    temporal: 'dataType.temporal.label',
    unknown: 'dataType.unknown.label'
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { taskLocalisedConfig } = defineProps<{ taskLocalisedConfig: LocalisedConfig<TaskConfig> }>();

const emit = defineEmits<{ 'task-completed': [taskLocalisedConfig: LocalisedConfig<TaskConfig>] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// ── Data View
const { data: dataViewConfig } = useDataView(() => resolveDataViewIdParameter(route.params.dataViewId));
const { mutateAsync: updateDataView } = useUpdateDataView();

// ── Audit
const auditIsRunning = ref(false);
const auditIsAbandoned = ref(false); // Set on leaving the panel, so the stopped audit is not reported as a failure.
const auditedRecordCount = ref(0);
const auditFailure = shallowRef<AppFailure>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

const contentAuditConfig = computed(() => dataViewConfig.value?.contentAuditConfig);

const auditDetails = computed((): AuditDetail[] => {
    const auditConfig = contentAuditConfig.value;
    if (auditConfig == null) return [];
    const numberFormat = new Intl.NumberFormat(localeId.value);
    const formatCount = (count: number | undefined): string | undefined => (count == null ? undefined : numberFormat.format(count));
    // One decimal place, with more only for a time too short to show in one, so a quick audit does not read as 0.
    const secondsFormat = new Intl.NumberFormat(localeId.value, {
        style: 'unit',
        unit: 'second',
        maximumFractionDigits: 1,
        maximumSignificantDigits: 1,
        minimumFractionDigits: 1,
        minimumSignificantDigits: 1,
        roundingPriority: 'morePrecision'
    });
    const formatSeconds = (milliseconds: number | undefined): string | undefined => (milliseconds == null ? undefined : secondsFormat.format(milliseconds / 1000));
    const details: AuditDetail[] = [
        { id: 'records', labelKey: 'detail.records.label', value: formatCount(auditConfig.recordCount) },
        { id: 'lines', labelKey: 'detail.lines.label', value: formatCount(auditConfig.lineCount) },
        { id: 'emptyLines', labelKey: 'detail.emptyLines.label', value: formatCount(auditConfig.emptyLineCount) },
        { id: 'commentLines', labelKey: 'detail.commentLines.label', value: formatCount(auditConfig.commentLineCount) },
        { id: 'unevenRecords', labelKey: 'detail.unevenRecords.label', value: formatCount(auditConfig.invalidFieldLengthCount) },
        { id: 'duration', labelKey: 'detail.duration.label', value: formatSeconds(auditConfig.duration) },
        { id: 'sourceWait', labelKey: 'detail.sourceWait.label', value: formatSeconds(auditConfig.sourceWaitDuration) }, // Part of the duration. Not shown for audits saved before it was measured.
        { id: 'asAt', labelKey: 'detail.asAt.label', value: new Intl.DateTimeFormat(localeId.value, { dateStyle: 'medium', timeStyle: 'short' }).format(auditConfig.asAt) }
    ];
    return details.filter((detail) => detail.value != null);
});

const auditColumnRows = computed(() => {
    const numberFormat = new Intl.NumberFormat(localeId.value);
    return (contentAuditConfig.value?.columns ?? []).map((columnConfig, index) => ({
        label: columnConfig.label[localeId.value] ?? columnConfig.label.en ?? String(index + 1),
        dataTypeLabel: t(TEXT, DATA_TYPE_LABEL_KEYS[columnConfig.dataTypeId]),
        formatText: Object.entries(columnConfig.formats)
            .toSorted((left, right) => right[1] - left[1])
            .map(([formatId, count]) => `${formatId} (${numberFormat.format(count)})`)
            .join(', '),
        blankValueText: columnConfig.blankValueCount == null ? '' : numberFormat.format(columnConfig.blankValueCount),
        invalidValueText: columnConfig.invalidValueCount == null ? '' : numberFormat.format(columnConfig.invalidValueCount),
        missingValueText: columnConfig.missingValueCount == null ? '' : numberFormat.format(columnConfig.missingValueCount),
        readingText: constructReadingText(columnConfig),
        validValueText: columnConfig.validValueCount == null ? '' : numberFormat.format(columnConfig.validValueCount)
    }));
});

const auditPendingText = computed(() => t(TEXT, 'audit.pending.text', { count: new Intl.NumberFormat(localeId.value).format(auditedRecordCount.value) }));

// ── Side Effects ─────────────────────────────────────────────────────────────────────────────────────────────────────

// An item committed without a saved audit is audited as soon as it opens here. A saved audit is shown as it is, and
// only 'Audit again' replaces it. A failed audit waits for the user to retry.
watch(
    () => dataViewConfig.value != null && dataViewConfig.value.contentAuditConfig == null,
    (dataViewNeedsAudit) => {
        if (dataViewNeedsAudit && !auditIsRunning.value && auditFailure.value == null) void auditContent();
    },
    { immediate: true }
);

// An audit reads the whole item, so leaving stops it rather than letting it run on unseen.
onBeforeUnmount(() => {
    if (!auditIsRunning.value || dataViewConfig.value == null) return;
    auditIsAbandoned.value = true;
    void abortDataViewContentAudit(dataViewConfig.value.connectionId).catch((error: unknown) => {
        raiseFailure(new AppError('Failed to stop the audit.', 'dpuse-app.AuditContentPanel', { typeId: 'handled' }, { cause: error }));
    });
});

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleAuditAgain(): void {
    void auditContent();
}

// TODO: Import the audited records into a DPUse store, so Explore Data can show them, before moving on.
function handleCommitDetail(): void {
    emit('task-completed', taskLocalisedConfig);
    void ignoreReportedNavigationFailure(router.push({ name: 'data', query: route.query }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// How the audit decided to read values that could be taken two ways. It says so when the column's own values did not
// settle it, because those values may then be loaded wrongly.
function constructReadingText(columnConfig: ObjectColumnConfig): string {
    const readings: string[] = [];
    if (columnConfig.dateOrderId != null) readings.push(t(TEXT, columnConfig.dateOrderId === 'dayFirst' ? 'reading.dayFirst.text' : 'reading.monthFirst.text'));
    if (columnConfig.decimalSeparatorId != null) readings.push(t(TEXT, columnConfig.decimalSeparatorId === ',' ? 'reading.decimalComma.text' : 'reading.decimalPoint.text'));
    const readingText = readings.join(', ');
    return columnConfig.isFormatAmbiguous === true ? t(TEXT, 'reading.unclear.text', { reading: readingText }) : readingText;
}

// The data view is saved with the audit as it was when the audit started, with any later save to it, such as a new
// label, kept.
async function auditContent(): Promise<void> {
    const auditedDataViewConfig = dataViewConfig.value;
    if (auditedDataViewConfig == null || auditIsRunning.value) return;
    auditIsRunning.value = true;
    auditedRecordCount.value = 0;
    auditFailure.value = undefined;
    try {
        const newContentAuditConfig = await auditDataViewContent(auditedDataViewConfig, (recordCount) => {
            auditedRecordCount.value = recordCount;
        });
        const latestDataViewConfig: DataViewConfig = dataViewConfig.value.id === auditedDataViewConfig.id ? dataViewConfig.value : auditedDataViewConfig;
        await updateDataView({ ...latestDataViewConfig, contentAuditConfig: newContentAuditConfig });
    } catch (error) {
        if (auditIsAbandoned.value) return;
        auditFailure.value = raiseFailure(new AppError('Failed to audit this item.', 'dpuse-app.AuditContentPanel.auditContent', { typeId: 'handled' }, { cause: error }));
    } finally {
        auditIsRunning.value = false;
    }
}
</script>

<template>
    <div class="relative flex min-h-0 flex-1 flex-col" data-region="AuditContentPanel">
        <BusyBar v-if="auditIsRunning" />

        <ErrorNotice v-if="auditFailure" :failures="[auditFailure]" @retry="handleAuditAgain" />

        <template v-else>
            <!-- Toolbar ─ 'Audit again' is for an item whose data may have changed since it was audited. -->
            <div class="flex h-9.25 flex-none items-center justify-end border-b border-separator px-page text-xs">
                <ActionWrapper :disabled="auditIsRunning" class="inline-flex items-center gap-x-1 text-accent hover:underline disabled:text-muted" @click="handleAuditAgain">
                    <RefreshCwIcon aria-hidden="true" class="size-4" :stroke-width="1.5" />
                    {{ t(TEXT, 'audit.again.label') }}
                </ActionWrapper>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-page py-4">
                <!-- Announced as it changes, because the count is the only sign that a long audit is still going. -->
                <p v-if="auditIsRunning" aria-live="polite" class="text-sm text-muted">{{ auditPendingText }}</p>

                <template v-else-if="contentAuditConfig">
                    <dl class="grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&>dt]:pr-4">
                        <template v-for="auditDetail in auditDetails" :key="auditDetail.id">
                            <dt class="text-muted">{{ t(TEXT, auditDetail.labelKey) }}</dt>
                            <dd class="m-0">{{ auditDetail.value }}</dd>
                        </template>
                    </dl>

                    <ScrollRegion v-if="auditColumnRows.length > 0" v-slot="{ labelId }" class="mt-4" is-label-shown :label="t(TEXT, 'columnTable.title')">
                        <table :aria-labelledby="labelId" class="text-sm whitespace-nowrap">
                            <thead>
                                <tr class="text-left">
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.label') }}</th>
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.dataType.label') }}</th>
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.validValues.label') }}</th>
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.invalidValues.label') }}</th>
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.blankValues.label') }}</th>
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.missingValues.label') }}</th>
                                    <th class="py-1 pr-4 font-normal text-muted">{{ t(TEXT, 'column.reading.label') }}</th>
                                    <th class="py-1 font-normal text-muted">{{ t(TEXT, 'column.formats.label') }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="(columnRow, index) in auditColumnRows" :key="index">
                                    <td class="py-1 pr-4">{{ columnRow.label }}</td>
                                    <td class="py-1 pr-4">{{ columnRow.dataTypeLabel }}</td>
                                    <td class="py-1 pr-4">{{ columnRow.validValueText }}</td>
                                    <td class="py-1 pr-4">{{ columnRow.invalidValueText }}</td>
                                    <td class="py-1 pr-4">{{ columnRow.blankValueText }}</td>
                                    <td class="py-1 pr-4">{{ columnRow.missingValueText }}</td>
                                    <td class="py-1 pr-4">{{ columnRow.readingText }}</td>
                                    <td class="py-1">{{ columnRow.formatText }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </ScrollRegion>
                </template>
            </div>
        </template>

        <PillButton v-if="contentAuditConfig && !auditIsRunning" :icon="ArrowRightIcon" :label="t(TEXT, 'explore.label')" @click="handleCommitDetail" />
    </div>
</template>
