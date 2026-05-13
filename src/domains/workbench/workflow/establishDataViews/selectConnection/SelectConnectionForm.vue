<script setup lang="ts">
// External Dependencies
import { ArrowBigRightIcon } from 'lucide-vue-next';
import { useRoute, useRouter } from 'vue-router';

// DPUse Framework
import type { ConnectionConfig } from '@dpuse/dpuse-shared/component/connection';
import type { EngineAuthActionOptions } from '@dpuse/dpuse-shared/engine';
import type { LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// Local (App) Framework
import { accountId } from '@/observability/accountMonitor';
import T from './SelectConnectionForm.json';
import { t } from '@/state/locale';

// Local Components - Static
import ActionBar from '@/components/layout/actionBar/ActionBar.vue';
import Button from '@/components/ui/button/Button.vue';
import ScrollArea from '@/components/layout/scrollArea/ScrollArea.vue';
import { useEngine } from '~/src/services/useEngine';

// Options, Properties, Slots & Emits ──────────────────────────────────────────────────────────────────────────────────

const { connectionLocalisedConfig } = defineProps<{ connectionLocalisedConfig: LocalisedConfig<ConnectionConfig> }>();
const emit = defineEmits<{ submit: [] }>();

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

const route = useRoute();
const router = useRouter();

// const xxxx = {
//     access_token:
//         'sl.u.AGeZBEVveJ8oMFe5ahZWck5hE1Gxa6sbTsK2VzZmcOda1FA_3NZqMEdJoRZBlI_F9krIEnabwL4gYBW1_avPXULdHFmaS0BnJrvrkToaKqa6pS5i2S9OeYdY6X1GV8D4YT2_4n9xauWuws31X1kI4T51NyQVVzNalwE2VLTrAAeKdDLxpkwN64bvqsw07CutCraJJAenx0pOSrEQ-tbsJ3wtJXpHhXQoilYa6AlhH7FgFLXZsikaZ3UNMexmaRb_10N0HFT7exaoMdKfhZfRBi8Fg7Z54cXjX2zKmAhg-4E0LMU3tH3_82hT-NMlu-ce3-mUfmuzMQeYX4Klb1YVNpq1nUWdswlDhEv7Rmh_98ac9Lh_V35WxtDPaKXLKoiDEY_AVtJBPpo33rM0q7GxnpPOkvx4mv7TsryioNmbtwr1Nuc2jwGgvxfmIn-GBuCRrql334c14OEh7x7bQDlFatU5EOWvuacyLU8wLC8Uwm9gT8RiPhLvWex1w1KqddG_aW8QMYE_Z8t1lEGCvcBaf3kM93IsqajMSAd7Qh6fAaPZRzduu_fXBhnnyfdMiJuU1xrfRh-wxTzrxCQz3S3XSGUWgDUNR83Hhsc98Rz2JJQJWwDCZKsU7HmYwdotc_R5r0Z8-_cz4tSNHExlRvhQ42M--LPxkZ-YmCu5xJpLsACiZtNyJ38iHzp3yPqcNoxgMSaKiKmuvWe82XVhz-OVfGD3gSbAep2l9KWZS9fagloiHMn4y-artlORq33ES_7oiBTHw0vKXkjQp_IPmm72ThC9C3px20DXq9GMYJXYtdwIPytj2zmuxb5H4l8K-WPocDkDd9nHnbwC5Ke8lfywNTA9Xl2EpRdvtwd0dpv1qhoabaUxLhUtFsPVpec6w5r-8walFkhFhbS747y8oKmlADgcbUwAlBK96GhENOKnEPdqyL-RxygQyKAdbw2NTINvVJHz3IAVcPsNdK83TptHMRJ_t_A9J4qzvHkDCEjzPYNJPwBEdDle6KTXvvAgaW3RXmnZw2Im5r78Ex-wDCiZNlsKlN4g-k93apNvhkgfzTx0oclJ6NAZg8x5W6oZs2zeb_XnMSh8peKsYTjJZCynLbSGyJ-EmR9V-my2IGgHPMz5iC7bHaUk2U-2n3E77xIHLt2167RNPyVRFxwRJXRfOheRFkLE85FSq-RAGEJ8NAMHMNVylIjyAomKmD9O126n5uPqsYQJPaTv6O6b7I9jmfh7sAk1ymMvNimqRisSa6-K3MJNljqb0MrhzT6RB1aQFKacdD2Kh28-WXw5U_zavodWdyiZhu01un9-32PXkM8zrw',
//     token_type: 'bearer',
//     expires_in: 14400,
//     refresh_token: '-dn2rpMmEWkAAAAAAAAAAU2EGh_wWOGaQ4IrP3UMHJ2X51LIznwqQsRVhfY2r5V0',
//     scope: 'account_info.read files.content.read files.metadata.read',
//     uid: '31720052',
//     account_id: 'dbid:AACIuki-VaevWS1o6a2PeRkWomX02eqjwcA'
// };

// Handlers ────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function handleSubmit(): Promise<void> {
    emit('submit');
    await router.push({ name: 'selectNode', query: { ...route.query, wbView: 'selectNode' } });
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

async function testAuth(): Promise<void> {
    if (connectionLocalisedConfig == null) return;
    const { processRequest } = await useEngine();
    (await processRequest('authenticateConnection', connectionLocalisedConfig, {
        accountId,
        windowCenterX: screen.width / 2,
        windowCenterY: screen.height / 2
    })) as EngineAuthActionOptions;
}
</script>

<template>
    <form class="relative flex h-full flex-col pl-4" @submit.prevent="handleSubmit">
        <ScrollArea class="flex-1" scroll-area-inset="screen">
            <div class="flex flex-col gap-y-4 pt-2">
                {{ connectionLocalisedConfig?.connectorConfig.description.en }}

                <div>
                    <div><strong>Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.id }}</div>
                    <div><strong>Category Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.categoryId }}</div>
                    <div><strong>Status Id:</strong> {{ connectionLocalisedConfig?.statusId }}</div>
                    <div><strong>Status Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.statusId }}</div>
                    <div><strong>Type Id:</strong> {{ connectionLocalisedConfig?.typeId }}</div>
                    <div><strong>Type Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.typeId }}</div>
                    <div><strong>Usage Id:</strong> {{ connectionLocalisedConfig?.connectorConfig.usageId }}</div>
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
                    <div>iconNeutral: {{ connectionLocalisedConfig.iconNeutral != null }}</div>
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
                    <div>operations: {{ connectionLocalisedConfig?.connectorConfig.operations }}</div>
                    <div>lastUpdatedAt: {{ connectionLocalisedConfig.lastUpdatedAt }}</div>
                    <div>lastVerifiedAt: {{ connectionLocalisedConfig.lastVerifiedAt }}</div>
                    <div>status: {{ connectionLocalisedConfig?.connectorConfig.status }}</div>
                    <div>statusId: {{ connectionLocalisedConfig?.connectorConfig.statusId }}</div>
                    <div>typeId: {{ connectionLocalisedConfig?.connectorConfig.typeId }}</div>
                    <div>usageId: {{ connectionLocalisedConfig?.connectorConfig.usageId }}</div>
                    <div>vendorAccountURL: {{ connectionLocalisedConfig?.connectorConfig.vendorAccountURL }}</div>
                    <div>vendorDocumentationURL: {{ connectionLocalisedConfig?.connectorConfig.vendorDocumentationURL }}</div>
                    <div>vendorHomeURL: {{ connectionLocalisedConfig?.connectorConfig.vendorHomeURL }}</div>
                    <div>version: {{ connectionLocalisedConfig?.connectorConfig.version }}</div>
                </div>
            </div>
        </ScrollArea>

        <ActionBar class="absolute right-4 bottom-(--safe-bottom-offset)" variant="step" @action="handleSubmit">
            <template #action>
                <ArrowBigRightIcon class="size-5" :stroke-width="1.25" />
                <div class="flex flex-col items-start leading-tight">
                    <span>Select</span>
                    <span>Connection</span>
                </div>
            </template>
        </ActionBar>
    </form>
</template>
