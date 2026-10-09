// What a data view's list card and detail panel both show: its progress through the steps and the connection behind it.
// Held in one place so the card, the panel and the open action always agree.

// ── External Dependencies & Registrations ────────────────────────────────────────────────────────────────────────────

// ── DPUse Framework
import type { DataViewConfig, getComponentStatus } from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type DataViewProgress = Pick<DataViewConfig, 'connectionId' | 'connectionNodeConfig' | 'contentAuditConfig'>;

export type DataViewStepId = 'connection' | 'content' | 'data' | 'item'; // Each id is also the route name of its step.

export interface DataViewStep {
    id: DataViewStepId;
    state: 'done' | 'pending';
}

// A data view's connection, already localised. A connector such as Dropbox can have several connections ('Personal',
// 'Work'), so the connection's own name leads, and the connector's details describe what kind of connection it is.
export interface DataViewConnection {
    categoryLabel: string; // The connector's.
    connectorId: string; // Links to the connector in Setup.
    connectorLabel: string;
    icon?: null | string;
    iconDark?: null | string;
    label: string;
    status: ReturnType<typeof getComponentStatus> | undefined; // The connector's; undefined for general availability, which has no label.
    version: string; // The connector's.
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Exploring is left out: it never has to be finished, so it is never outstanding.
export function constructDataViewSteps(dataViewConfig: DataViewProgress): DataViewStep[] {
    return [
        { id: 'connection', state: dataViewConfig.connectionId == null ? 'pending' : 'done' },
        { id: 'item', state: dataViewConfig.connectionNodeConfig == null ? 'pending' : 'done' },
        { id: 'content', state: dataViewConfig.contentAuditConfig == null ? 'pending' : 'done' }
    ];
}

// The first step still pending, or exploring once every step is done.
export function resolveCurrentDataViewStepId(dataViewConfig: DataViewProgress): DataViewStepId {
    return constructDataViewSteps(dataViewConfig).find((step) => step.state === 'pending')?.id ?? 'data';
}
