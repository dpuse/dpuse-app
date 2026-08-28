<script setup lang="ts">
// ── External Dependencies & Registrations
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/component/module/engine';
import { getComponentStatus } from '@dpuse/dpuse-shared/component';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local Framework
import { accountId } from '@/state/session';
import { useEngine } from '@/services/useEngine';

// ── Static Components
import DetailPanel from '@/studio/components/DetailPanel.vue';
import DocumentPanel from '@/studio/components/DocumentPanel.vue';
import ScrollArea from '@/components/ui/scroll/ScrollArea.vue';
import Tag from '@/components/ui/Tag.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const T = {
    Select_Connection: { en: 'Select Connection', es: 'Seleccionar Conexión' },
    Select_a_connection_to_configure_the_data_view_before_continuing: {
        en: 'Review the selected connection and leave space for connection-specific settings before continuing.',
        es: 'Revise la conexión seleccionada y deje espacio para configuraciones específicas de la conexión antes de continuar.'
    },
    Selected_Connection: { en: 'Selected Connection', es: 'Conexión Seleccionada' },
    Connection_Type: { en: 'Connection Type', es: 'Tipo de Conexión' },
    Capabilities: { en: 'Capabilities', es: 'Capacidades' },
    Configuration: { en: 'Configuration', es: 'Configuración' },
    Add_connection_specific_fields_here_as_this_workflow_evolves: {
        en: 'Add connection-specific fields here as this workflow evolves.',
        es: 'Agregue aquí campos específicos de la conexión a medida que evolucione este flujo de trabajo.'
    },
    Implementation_not_available: { en: 'Implementation not available', es: 'Implementación no disponible' },
    No_connection_selected: { en: 'No connection selected', es: 'No se ha seleccionado ninguna conexión' },
    Choose_a_connection_from_the_list_to_continue: {
        en: 'Choose a connection from the list to continue.',
        es: 'Elija una conexión de la lista para continuar.'
    },
    Continue: { en: 'Continue', es: 'Continuar' }
};

// ── Options, Props, Slots & Emits ────────────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> }>();
defineEmits<{ close: [] }>();

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();
const connectorStatus = computed(() => (connectionLocalisedConfig.statusId ? getComponentStatus(connectionLocalisedConfig.statusId) : undefined));

// ── Event Handlers ───────────────────────────────────────────────────────────────────────────────────────────────────

function handleSubmit(): void {
    void router.push({ name: 'items', query: { ...route.query, sView: 'items' } }).catch(() => {
        // Already reported by 'router.onError'.
    });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function testAuth(): Promise<void> {
    const { processRequest } = await useEngine();
    (await processRequest('authenticateConnection', connectionLocalisedConfig, {
        accountId: accountId.value,
        windowCenterX: screen.width / 2,
        windowCenterY: screen.height / 2
    })) as EngineAuthActionOptions;
}
</script>

<template>
    <DetailPanel data-region="SelectConnectionPanel">
        <ScrollArea class="flex-1" scroll-area-padding-bottom="var(--vertical-scroll-bottom-screen-inset)">
            <DocumentPanel overline="Connections" :title="connectionLocalisedConfig.label" @close="$emit('close')">
                <!-- Tags -->
                <div class="mt-3 mb-6 flex flex-wrap gap-1.5">
                    <Tag :text="connectionLocalisedConfig.connectorConfig.categoryId" />
                    <Tag :text="`v${connectionLocalisedConfig.connectorConfig.version}`" />
                    <Tag v-if="connectorStatus" :text="connectionLocalisedConfig.statusId ?? ''" :color="connectorStatus.color" />
                </div>

                <!-- Description -->
                <p v-if="connectionLocalisedConfig.description">{{ connectionLocalisedConfig.description }}</p>
            </DocumentPanel>
        </ScrollArea>
    </DetailPanel>

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

                <Button @click="testAuth">Auth</Button>

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
