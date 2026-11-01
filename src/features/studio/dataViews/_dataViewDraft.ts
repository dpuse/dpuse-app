// ── External Dependencies & Registrations
import { computed, shallowRef } from 'vue';

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { forgetDraftLoad, promoteDraftLoad } from './_dataViewStore';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The open data view with the user's changes, held only in this page's memory. Nothing is stored until Save, so a
// reload or a crash loses the changes and the data view opens as last saved.
export const draftDataViewConfig = shallowRef<DataViewConfig>();

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

export const dataViewHasChanges = computed(() => draftDataViewConfig.value != null);

// A data view is saved whole, so a change of connection or item can be discarded but not saved until an item is previewed.
export const dataViewCanBeSaved = computed(() => draftDataViewConfig.value?.connectionNodeConfig != null && draftDataViewConfig.value.previewConfig != null);

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function changeDataView(dataViewConfig: DataViewConfig): void {
    draftDataViewConfig.value = dataViewConfig;
}

// Save has written the draft: any records loaded for it become the data view's own.
export function completeDataViewDraft(): void {
    if (draftDataViewConfig.value != null) promoteDraftLoad(draftDataViewConfig.value.id);
    draftDataViewConfig.value = undefined;
}

export function discardDataViewDraft(): void {
    if (draftDataViewConfig.value != null) forgetDraftLoad(draftDataViewConfig.value.id);
    draftDataViewConfig.value = undefined;
}
