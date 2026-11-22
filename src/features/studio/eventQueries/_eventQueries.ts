// ── External Dependencies & Registrations
import { type MaybeRefOrGetter, toValue } from 'vue';
import { useMutation, type UseMutationReturnType, useQuery, type UseQueryReturnType } from '@tanstack/vue-query';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared';
import type { ContextEventReference, EventQueryConfig, LocaleId } from '@dpuse/dpuse-shared';

// ── Local Framework
import { assertDefined } from '@/utilities/index.ts';
import { queryClient } from '@/services/queryClient';
import { useStudioOptions } from '@/features/studio/options/useStudioOptions';
import {
    constructWorkspaceStoreListKey,
    constructWorkspaceStoreRecordKey,
    getWorkspaceStoreRecord,
    removeWorkspaceStoreRecord,
    retrieveWorkspaceStoreRecords,
    upsertWorkspaceStoreRecord,
    workspaceStoreId
} from '@/services/workspaceStore';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const EVENT_QUERY_LIST_KEY = constructWorkspaceStoreListKey('eventQueries');
const UNTITLED_EVENT_QUERY_LABEL = { en: 'Untitled Event Query', es: 'Consulta de eventos sin título' }; // Stored with the record, so it carries every language rather than reading the current one.

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Read once and then kept current by the event query mutations, which write every change into the cache as it is
// saved. The read takes TanStack Query's abort signal, so cancelling it, or leaving the list while it loads, stops the
// wait.
export function useEventQueries(): UseQueryReturnType<EventQueryConfig[], Error> {
    return useQuery({
        queryKey: EVENT_QUERY_LIST_KEY,
        queryFn: ({ signal }) => retrieveEventQueryConfigs(signal),
        staleTime: Infinity
    });
}

// Each id has its own entry in the cache, so an event query that arrives after the user has moved on to another one
// lands in its own entry and never replaces what is on screen. Opened from the list, it starts from the list's copy
// rather than reading the store again.
export function useEventQuery(eventQueryId: MaybeRefOrGetter<string | undefined>): UseQueryReturnType<EventQueryConfig, Error> {
    return useQuery(() => {
        const id = toValue(eventQueryId);
        return {
            queryKey: constructWorkspaceStoreRecordKey('eventQueries', id),
            queryFn: () => getEventQueryConfig(assertDefined(id)),
            enabled: id != null,
            initialData: () => queryClient.getQueryData<EventQueryConfig[]>(EVENT_QUERY_LIST_KEY)?.find((config) => config.id === id),
            initialDataUpdatedAt: () => queryClient.getQueryState(EVENT_QUERY_LIST_KEY)?.dataUpdatedAt,
            staleTime: Infinity
        };
    });
}

export function useUpdateEventQuery(): UseMutationReturnType<EventQueryConfig, Error, EventQueryConfig, unknown> {
    return useMutation({ mutationFn: saveEventQueryConfig });
}

export function useDeleteEventQuery(): UseMutationReturnType<void, Error, string, unknown> {
    return useMutation({ mutationFn: removeEventQueryConfig });
}

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Read once, as an icon does not change with the language.
const eventQueryIcon = assertDefined(
    useStudioOptions().value.find((config) => config.id === 'eventQueries'),
    "Expected an 'eventQueries' entry from useStudioOptions()."
).icon;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Stops a list read that is taking too long. The list goes back to not loaded, rather than failed, until it is read
// again.
export async function cancelEventQueryRetrieval(): Promise<void> {
    await queryClient.cancelQueries({ queryKey: EVENT_QUERY_LIST_KEY });
}

// An event query for one context event, not saved yet. The name the user gives it goes into the entry for the current
// language. The other languages keep the untitled name, so no language shows the record's id instead.
export function constructNewEventQueryConfig(contextEventReference: ContextEventReference, localeId: LocaleId, label: string, description: string): EventQueryConfig {
    return {
        id: crypto.randomUUID(),
        label: label === '' ? UNTITLED_EVENT_QUERY_LABEL : { ...UNTITLED_EVENT_QUERY_LABEL, [localeId]: label },
        description: description === '' ? {} : { [localeId]: description },
        icon: null,
        iconDark: null,
        typeId: 'eventQuery',
        contextEventReference,
        status: null,
        statusId: null,
        firstCreatedAt: null,
        lastUpdatedAt: null
    };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function retrieveEventQueryConfigs(signal: AbortSignal): Promise<EventQueryConfig[]> {
    try {
        const eventQueryConfigs = await retrieveWorkspaceStoreRecords<EventQueryConfig>('eventQueries', signal);
        return eventQueryConfigs.map((config) => restoreEventQueryConfig(config));
    } catch (error) {
        if (signal.aborted) throw error; // A cancelled read is not a failure, so it keeps its abort reason.
        throw new AppError('Failed to retrieve event queries.', 'dpuse-app.eventQueries.retrieveEventQueryConfigs', { data: { typeId: 'handled' }, cause: error });
    }
}

async function getEventQueryConfig(id: string): Promise<EventQueryConfig> {
    try {
        const eventQueryConfig = await getWorkspaceStoreRecord<EventQueryConfig>('eventQueries', id);
        return restoreEventQueryConfig(eventQueryConfig);
    } catch (error) {
        throw new AppError('Failed to open this event query.', 'dpuse-app.eventQueries.getEventQueryConfig', { data: { typeId: 'handled' }, cause: error });
    }
}

// A stored record gets back the icon, which is not stored.
function restoreEventQueryConfig(storedEventQueryConfig: EventQueryConfig): EventQueryConfig {
    return { ...storedEventQueryConfig, icon: eventQueryIcon };
}

// The cache is written here rather than in 'onSuccess', because only here is the store the change went to known.
async function saveEventQueryConfig(eventQueryConfig: EventQueryConfig): Promise<EventQueryConfig> {
    try {
        const storeId = await upsertWorkspaceStoreRecord('eventQueries', { ...eventQueryConfig, icon: null, iconDark: null }); // The icon is added on reading, so it is not stored.
        const savedEventQueryConfig = { ...eventQueryConfig, icon: eventQueryIcon };
        if (storeId === workspaceStoreId.value) writeEventQueryConfigToCache(savedEventQueryConfig); // A save that finishes after signing in or out stays out of the next user's lists.
        return savedEventQueryConfig;
    } catch (error) {
        throw new AppError('Failed to save event query.', 'dpuse-app.eventQueries.saveEventQueryConfig', { data: { typeId: 'handled' }, cause: error });
    }
}

async function removeEventQueryConfig(id: string): Promise<void> {
    try {
        const storeId = await removeWorkspaceStoreRecord('eventQueries', id);
        if (storeId === workspaceStoreId.value) removeEventQueryConfigFromCache(id); // As for a save.
    } catch (error) {
        throw new AppError('Failed to remove event query.', 'dpuse-app.eventQueries.removeEventQueryConfig', { data: { typeId: 'handled' }, cause: error });
    }
}

// A list not loaded yet is left alone. Loading it later picks up the change.
function writeEventQueryConfigToCache(eventQueryConfig: EventQueryConfig): void {
    queryClient.setQueryData(constructWorkspaceStoreRecordKey('eventQueries', eventQueryConfig.id), eventQueryConfig);
    queryClient.setQueryData<EventQueryConfig[]>(EVENT_QUERY_LIST_KEY, (eventQueryConfigs) => {
        if (eventQueryConfigs == null) return eventQueryConfigs;
        return eventQueryConfigs.some((config) => config.id === eventQueryConfig.id)
            ? eventQueryConfigs.map((config) => (config.id === eventQueryConfig.id ? eventQueryConfig : config))
            : [...eventQueryConfigs, eventQueryConfig];
    });
}

function removeEventQueryConfigFromCache(id: string): void {
    queryClient.setQueryData<EventQueryConfig[]>(EVENT_QUERY_LIST_KEY, (eventQueryConfigs) => eventQueryConfigs?.filter((config) => config.id !== id));
    queryClient.removeQueries({ queryKey: constructWorkspaceStoreRecordKey('eventQueries', id), exact: true });
}
