// ── External Dependencies & Registrations
import { computed, type ComputedRef, type Component as VueComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { defineAsyncPanel } from '@/utilities/index.ts';

// ── Dynamic Components
// Every dialog body is loaded on demand. The frame is rendered from the URL alone, so the body arrives behind its own
// spinner and none of this is in the initial bundle.
const ContextModelDimensionSchemaDiagramPanel = defineAsyncPanel(
    () => import('@/features/studio/setup/context/ContextDimensionSchemaDiagramPanel.vue'),
    'ContextModelDimensionSchemaDiagramPanel'
);
const ContextModelEntityRelationshipDiagramPanel = defineAsyncPanel(
    () => import('@/features/studio/setup/context/ContextEntityRelationshipDiagramPanel.vue'),
    'ContextModelEntityRelationshipDiagramPanel'
);
const ConnectionPanel = defineAsyncPanel(() => import('@/features/studio/connectionPanel/ConnectionPanel.vue'), 'ConnectionPanel', { simulation: { delayMs: 0 } });
const SessionAccountPanel = defineAsyncPanel(() => import('@/features/session/accountPanel/SessionAccountPanel.vue'), 'SessionAccountPanel');
const SessionAuthPanel = defineAsyncPanel(() => import('@/features/session/authPanel/SessionAuthPanel.vue'), 'SessionAuthPanel');

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Only the outer chrome is listed: each dialog still owns its own header, keeping its title with its translations. The
// shape has to be known here because the frame is rendered from the URL, before the dialog's own chunk exists.
export interface DialogConfig {
    component: VueComponent;
    maxWidth?: string;
    minHeight?: string;
    sizing: 'full' | 'reserved';
}

interface Dialogs {
    activeDialogConfig: ComputedRef<DialogConfig | undefined>;
    activeDialogId: ComputedRef<DialogId | undefined>;
    closeDialog: () => void;
    openDialog: (dialogId: DialogId) => Promise<void>;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Every dialog in the app. Registering here rather than at each call site is what puts the dialog in the URL, so a
// reload or a shared link reopens on it, and what keeps 'App.vue' to a single frame rather than one per feature.
// A dialog belongs here only if it can stand up from the URL alone: one that needs state from the panel that opened it
// would reopen over nothing, since panel selection is not in the URL.
const DIALOG_CONFIGS = {
    account: { component: SessionAccountPanel, sizing: 'full' },
    // Reserved rather than fixed: the sign-in body moves between steps of differing height, and the minimum is the
    // tallest of the short ones, so the frame neither collapses around the loading spinner nor towers over the first step.
    auth: { component: SessionAuthPanel, maxWidth: '24rem', minHeight: '250px', sizing: 'reserved' },
    connection: { component: ConnectionPanel, sizing: 'full' },
    modelDimensionDiagram: { component: ContextModelDimensionSchemaDiagramPanel, maxWidth: '90vw', minHeight: '90vh', sizing: 'full' },
    modelErdDiagram: { component: ContextModelEntityRelationshipDiagramPanel, maxWidth: '90vw', minHeight: '90vh', sizing: 'full' }
} satisfies Record<string, DialogConfig>;

export type DialogId = keyof typeof DIALOG_CONFIGS;

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// The whole dialog contract: which one the URL asks for, and the two navigations that change it. Opening replaces and
// closing pushes, so the dialog itself never becomes a step the back button has to walk through, while the state it
// was opened over stays reachable.
export function useDialogs(): Dialogs {
    const route = useRoute();
    const router = useRouter();

    const activeDialogId = computed<DialogId | undefined>(() => {
        const dialogId = String(route.query.dlg ?? '');
        return Object.hasOwn(DIALOG_CONFIGS, dialogId) ? (dialogId as DialogId) : undefined;
    });
    const activeDialogConfig = computed(() => (activeDialogId.value ? DIALOG_CONFIGS[activeDialogId.value] : undefined));

    // Called by the close button, by Escape, and by a dialog that has finished its own work, so it has to be safe to
    // call when there is nothing open — a body that commits and then unmounts would otherwise navigate twice.
    function closeDialog(): void {
        if (route.query.dlg == null) return;

        const query = { ...route.query };
        delete query.dlg;
        void router.push({ query }).catch(() => {
            // Already reported by 'router.onError'.
        });
    }

    // Awaitable, because a menu that opens a dialog should close only once the URL carries it. The failure is caught
    // here rather than at the call site so that the caller still gets its turn either way.
    async function openDialog(dialogId: DialogId): Promise<void> {
        try {
            await router.replace({ query: { ...route.query, dlg: dialogId } });
        } catch {
            // Already reported by 'router.onError'.
        }
    }

    return { activeDialogConfig, activeDialogId, closeDialog, openDialog };
}
