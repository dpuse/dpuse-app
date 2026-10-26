<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import { AppError, localiseConfig } from '@dpuse/dpuse-shared';
import type { ConnectionConfig, EngineAuthActionOptions, LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { accountId } from '@/state/session';
import { constructDataViewConnection } from '@/features/studio/dataViews/dataViewSummary';
import { establishEngineWorker } from '@/services/engine';
import { ignoreReportedNavigationFailure } from '@/router';
import { raiseAppFailure } from '@/state/errors';
import { TEXT } from './SelectConnectionPanel_.json';
import { useDataViews } from '@/features/studio/dataViews/_dataViews';
import { localeId, t } from '@/state/locale';

// ── Static Components
import ActionWrapper from '@/components/ui/action/ActionWrapper.vue';
import ConnectorDetails from '@/features/studio/dataViews/ConnectorDetails.vue';
import RectangleButton from '@/components/ui/action/RectangleButton.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import StudioDetailLayout from '@/features/studio/_components/StudioDetailLayout.vue';
import StudioDocumentPanel from '@/features/studio/_components/StudioDocumentPanel.vue';
import StudioDocumentSection from '@/features/studio/_components/StudioDocumentSection.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const COLLAPSED_DATA_VIEW_COUNT = 10; // Data views the Used By list shows until the user asks for the rest.

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> }>();

defineEmits<{ close: []; delete: []; hide: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

const { data: dataViewConfigs } = useDataViews();
const dataViewListIsExpanded = ref(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// ── Connector ─ First, because the connection's description is compared with the connector's. The rows are the
// same ones the data view document shows.
const connectorLocalisedConfig = computed(() => localiseConfig(connectionLocalisedConfig.connectorConfig, localeId.value));
const dataViewConnection = computed(() => constructDataViewConnection(connectionLocalisedConfig, localeId.value));

// ── Connection ─ A connection starts with a copy of its connector's description, which the Connector section already
// shows, so a prompt stands in for it until the connection has its own.
const connectionDescription = computed(() =>
    connectionLocalisedConfig.description === connectorLocalisedConfig.value.description ? undefined : connectionLocalisedConfig.description
);

// ── Authentication ─ A connector whose default implementation needs no sign-in gives one connection that anyone can
// use, so there is nothing to authenticate again.
const connectionNeedsSignIn = computed(() => {
    const { implementations } = connectionLocalisedConfig.connectorConfig;
    return !(Object.hasOwn(implementations, 'default') && implementations.default.authMethodId === 'none'); // The same test that creates the connection in 'configs.ts'.
});

// ── Used By ─ Sorted by name, and undefined until the data views have loaded, so the list never shows a state that is
// about to change. The data view being edited is not a link, because the user is already in it.
const usingDataViewItems = computed(() => {
    if (dataViewConfigs.value == null) return;
    return dataViewConfigs.value
        .filter((dataViewConfig) => dataViewConfig.connectionId === connectionLocalisedConfig.id)
        .map((dataViewConfig) => ({ id: dataViewConfig.id, isCurrent: dataViewConfig.id === route.params.dataViewId, label: localiseConfig(dataViewConfig, localeId.value).label }))
        .toSorted((left, right) => left.label.localeCompare(right.label, localeId.value));
});
const shownUsingDataViewItems = computed(() => (dataViewListIsExpanded.value ? usingDataViewItems.value : usingDataViewItems.value?.slice(0, COLLAPSED_DATA_VIEW_COUNT)));

// ── Removal ─ A connection that needs no sign-in is created by the app on every load, so deleting it would not last.
// It can only be hidden.
const connectionIsHideable = computed(() => !connectionNeedsSignIn.value);

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

async function handleReauthenticate(): Promise<void> {
    try {
        await testAuth();
    } catch (error) {
        raiseAppFailure(new AppError('Failed to authenticate connection.', 'dpuse-app.SelectConnectionPanel.handleReauthenticate', { typeId: 'handled' }, { cause: error }));
    }
}

function handleSubmit(): void {
    void ignoreReportedNavigationFailure(router.push({ name: 'item', query: route.query }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function testAuth(): Promise<void> {
    const { processRequest } = await establishEngineWorker();
    (await processRequest('authenticateConnection', connectionLocalisedConfig, {
        accountId: accountId.value,
        windowCenterX: screen.width / 2,
        windowCenterY: screen.height / 2
    })) as EngineAuthActionOptions;
}
</script>

<template>
    <StudioDetailLayout data-region="SelectConnectionPanel">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)" scroll-area-padding-left="var(--spacing-page)">
            <StudioDocumentPanel
                :icon="connectionLocalisedConfig.icon"
                :icon-dark="connectionLocalisedConfig.iconDark"
                :overline="t(TEXT, 'connections.label')"
                :title="connectionLocalisedConfig.label"
                @close="$emit('close')"
            >
                <!-- Description ─ The connection's own, or a prompt in its place. The prompt is not stored, so it follows the
                     language and can never be saved as the user's own text. -->
                <p v-if="connectionDescription">{{ connectionDescription }}</p>
                <p v-else class="text-muted">{{ t(TEXT, 'description.pending.text') }}</p>

                <StudioDocumentSection :title="t(TEXT, 'authentication.title')">
                    <RectangleButton v-if="connectionNeedsSignIn" variant="primary" @click="handleReauthenticate">{{
                        t(TEXT, 'authentication.reauthenticate.label')
                    }}</RectangleButton>
                    <p v-else>{{ t(TEXT, 'authentication.notRequired.text') }}</p>
                </StudioDocumentSection>

                <!-- Used By ─ One data view per line, with a line under each, as in the connector page's lists. The first ten
                     show until the user asks for the rest, as the data view document's tables do. -->
                <StudioDocumentSection :title="t(TEXT, 'usedBy.title')">
                    <template v-if="usingDataViewItems">
                        <ul v-if="usingDataViewItems.length > 0" class="text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:last-child]:border-b-0">
                            <li v-for="dataViewItem in shownUsingDataViewItems" :key="dataViewItem.id" class="min-w-0 wrap-break-word">
                                <template v-if="dataViewItem.isCurrent">
                                    {{ dataViewItem.label }} <span class="text-muted">{{ t(TEXT, 'usedBy.current.text') }}</span>
                                </template>
                                <RouterLink v-else :to="{ name: 'dataViews', params: { dataViewId: dataViewItem.id }, query: route.query }">{{ dataViewItem.label }}</RouterLink>
                            </li>
                        </ul>
                        <p v-else class="text-muted">{{ t(TEXT, 'usedBy.none.text') }}</p>
                        <div v-if="usingDataViewItems.length > COLLAPSED_DATA_VIEW_COUNT" class="mt-2 px-3 text-sm">
                            <ActionWrapper
                                :aria-expanded="dataViewListIsExpanded"
                                class="text-left text-accent hover:underline"
                                @click="dataViewListIsExpanded = !dataViewListIsExpanded"
                            >
                                {{ dataViewListIsExpanded ? t(TEXT, 'usedBy.showFewer.label') : t(TEXT, 'usedBy.showAll.label', { count: usingDataViewItems.length }) }}
                            </ActionWrapper>
                        </div>
                    </template>
                </StudioDocumentSection>

                <StudioDocumentSection :title="t(TEXT, 'connector.title')">
                    <p v-if="connectorLocalisedConfig.description">{{ connectorLocalisedConfig.description }}</p>
                    <dl
                        class="grid grid-cols-[minmax(7.5rem,max-content)_1fr] text-sm *:border-b *:border-separator *:py-1 [&:is(:last-child,:has(+section))>:nth-last-child(-n+2)]:border-b-0 [&>dt]:pr-4"
                    >
                        <ConnectorDetails :data-view-connection="dataViewConnection" />
                    </dl>
                </StudioDocumentSection>

                <!-- Last, so a destructive action is never one slip away from an everyday one, as in the data view document. A
                     connection that needs no sign-in is hidden rather than deleted, in the warning colour, because it can be
                     shown again. -->
                <StudioDocumentSection v-if="connectionIsHideable" :title="t(TEXT, 'hide.title')">
                    <p>{{ t(TEXT, 'hide.text') }}</p>
                    <RectangleButton variant="guarded" @click="$emit('hide')">{{ t(TEXT, 'hide.label') }}</RectangleButton>
                </StudioDocumentSection>
                <StudioDocumentSection v-else :title="t(TEXT, 'delete.title')">
                    <p>{{ t(TEXT, 'delete.text') }}</p>
                    <RectangleButton variant="destructive" @click="$emit('delete')">{{ t(TEXT, 'delete.label') }}</RectangleButton>
                </StudioDocumentSection>
            </StudioDocumentPanel>
        </ScrollArea>
    </StudioDetailLayout>

    <!-- <form class="relative flex h-full flex-col pl-4" data-region="SelectConnectionPanel" @submit.prevent="handleSubmit">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <div class="flex flex-col gap-y-4 pt-2">
                {{ connectionLocalisedConfig?.connectorConfig.description.en }}

                <div>
                    <div><strong>Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.id }}</div>
                    <div><strong>Category Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.categoryId }}</div>
                    <div><strong>Status Id:</strong> {{ connectionLocalisedConfig?.statusId }}</div>
                    <div><strong>Status Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.statusId }}</div>
                    <div><strong>Type Id:</strong> {{ connectionLocalisedConfig?.typeId }}</div>
                    <div><strong>Type Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.typeId }}</div>
                    <div><strong>Version:</strong> {{ connectionLocalisedConfig?.connectorConfig.version }}</div>
                </div>

                <RectangleButton @click="testAuth">Auth</RectangleButton>

                <div>
                    <strong>Connection:</strong>
                    <div>id: {{ connectionLocalisedConfig.id }}</div>
                    <div>label: {{ connectionLocalisedConfig.label }}</div>
                    <div>description: {{ connectionLocalisedConfig.description }}</div>
                    <div>notation: {{ connectionLocalisedConfig.notation }}</div>
                    <div>authorisation: {{ connectionLocalisedConfig.authorisation }}</div>
                    <div>firstCreatedAt: {{ connectionLocalisedConfig.firstCreatedAt }}</div>
                    <div>icon: {{ connectionLocalisedConfig.icon != null }}</div>
                    <div>iconDark: {{ connectionLocalisedConfig.iconDark != null }}</div>
                    <div>lastUpdatedAt: {{ connectionLocalisedConfig.lastUpdatedAt }}</div>
                    <div>lastVerifiedAt: {{ connectionLocalisedConfig.lastVerifiedAt }}</div>
                    <div>status: {{ connectionLocalisedConfig.status }}</div>
                    <div>statusId: {{ connectionLocalisedConfig.statusId }}</div>
                    <div>typeId: {{ connectionLocalisedConfig.typeId }}</div>
                </div>

                <div>
                    <strong>Connector:</strong>
                    <div>id: {{ connectionLocalisedConfig.connectorConfig.id }}</div>
                    <div>label: {{ connectionLocalisedConfig.connectorConfig.label }}</div>
                    <div>description: {{ connectionLocalisedConfig?.connectorConfig.description }}</div>
                    <div>category: {{ connectionLocalisedConfig?.connectorConfig.category }}</div>
                    <div>categoryId: {{ connectionLocalisedConfig?.connectorConfig.categoryId }}</div>
                    <div>firstCreatedAt: {{ connectionLocalisedConfig.firstCreatedAt }}</div>
                    <div>icon: {{ connectionLocalisedConfig.icon != null }}</div>
                    <div>iconDark: {{ connectionLocalisedConfig.iconDark != null }}</div>
                    <div>implementations: {{ connectionLocalisedConfig?.connectorConfig.implementations }}</div>
                    <div>actionNames: {{ connectionLocalisedConfig?.connectorConfig.actionNames }}</div>
                    <div>lastUpdatedAt: {{ connectionLocalisedConfig.lastUpdatedAt }}</div>
                    <div>lastVerifiedAt: {{ connectionLocalisedConfig.lastVerifiedAt }}</div>
                    <div>status: {{ connectionLocalisedConfig?.connectorConfig.status }}</div>
                    <div>statusId: {{ connectionLocalisedConfig?.connectorConfig.statusId }}</div>
                    <div>typeId: {{ connectionLocalisedConfig?.connectorConfig.typeId }}</div>
                    <div>vendorAccountURL: {{ connectionLocalisedConfig?.connectorConfig.vendorAccountURL }}</div>
                    <div>vendorDocumentationURL: {{ connectionLocalisedConfig?.connectorConfig.vendorDocumentationURL }}</div>
                    <div>vendorHomeURL: {{ connectionLocalisedConfig?.connectorConfig.vendorHomeURL }}</div>
                    <div>version: {{ connectionLocalisedConfig?.connectorConfig.version }}</div>
                </div>
            </div>
        </ScrollArea>
    </form> -->
</template>
