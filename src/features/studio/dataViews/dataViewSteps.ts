// The steps of establishing a data view. Held in one place so the list's step dots and its open action always agree on
// which step a data view is at.

// ── External Dependencies & Registrations ────────────────────────────────────────────────────────────────────────────

// ── DPUse Framework
import type { DataViewConfig } from '@dpuse/dpuse-shared/component/dataView';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DataViewProgress = Pick<DataViewConfig, 'connectionId' | 'connectionNodeConfig' | 'contentAuditConfig'>;

export type DataViewStepId = 'connections' | 'content' | 'data' | 'items'; // Each id is also the route name of its step.

export interface DataViewStep {
    id: DataViewStepId;
    state: 'done' | 'pending';
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Exploring is left out: it never has to be finished, so it is never outstanding.
export function constructDataViewSteps(dataViewConfig: DataViewProgress): DataViewStep[] {
    return [
        { id: 'connections', state: dataViewConfig.connectionId == null ? 'pending' : 'done' },
        { id: 'items', state: dataViewConfig.connectionNodeConfig == null ? 'pending' : 'done' },
        { id: 'content', state: dataViewConfig.contentAuditConfig == null ? 'pending' : 'done' }
    ];
}

// The first step still pending, or exploring once every step is done.
export function resolveCurrentDataViewStepId(dataViewConfig: DataViewProgress): DataViewStepId {
    return constructDataViewSteps(dataViewConfig).find((step) => step.state === 'pending')?.id ?? 'data';
}
