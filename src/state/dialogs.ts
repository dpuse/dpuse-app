// ── External Dependencies & Registrations
import { computed, type ComputedRef, type Component as VueComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// ── Local Framework
import { defineLazyComponent } from '@/utilities/index.ts';
import { ignoreReportedNavigationFailure } from '@/router';

// ── Dynamic Components
// Every dialog body is loaded on demand. The frame is rendered from the URL alone, so the body arrives behind its own
// spinner and none of this is in the initial bundle.
const ConnectionPanel = defineLazyComponent(() => import('@/features/studio/connectionPanel/ConnectionPanel.vue'), 'ConnectionPanel', { simulation: { delayMs: 0 } });
const SessionAccountPanel = defineLazyComponent(() => import('@/features/session/accountPanel/SessionAccountPanel.vue'), 'SessionAccountPanel');
const SessionAuthPanel = defineLazyComponent(() => import('@/features/session/authPanel/SessionAuthPanel.vue'), 'SessionAuthPanel');

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Only the frame is listed: each dialog still owns its own header, keeping its title with its translations. The
// shape has to be known here because the frame is rendered from the URL, before the dialog's own chunk exists.
export interface DialogConfig {
    component: VueComponent;
    maxWidth?: string;
    minHeight?: string;
    sizing: 'full' | 'reserved';
}

interface Dialogs {
    currentDialogConfig: ComputedRef<DialogConfig | undefined>;
    currentDialogId: ComputedRef<DialogId | undefined>;
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
    // A minimum height rather than a fixed one, because the sign-in steps differ in height. The minimum stops the frame
    // collapsing around the loading spinner without being taller than the first step.
    auth: { component: SessionAuthPanel, maxWidth: '24rem', minHeight: '250px', sizing: 'reserved' },
    connection: { component: ConnectionPanel, sizing: 'full' }
} satisfies Record<string, DialogConfig>;

export type DialogId = keyof typeof DIALOG_CONFIGS;

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Reads which dialog the URL asks for, and opens and closes dialogs by changing the URL. Opening replaces and closing
// pushes, so the dialog itself never becomes a step the back button has to walk through, while the state it
// was opened over stays reachable.
export function useDialogs(): Dialogs {
    const route = useRoute();
    const router = useRouter();

    const currentDialogId = computed<DialogId | undefined>(() => {
        const dialogId = String(route.query.dlg ?? '');
        return Object.hasOwn(DIALOG_CONFIGS, dialogId) ? (dialogId as DialogId) : undefined;
    });
    const currentDialogConfig = computed(() => (currentDialogId.value ? DIALOG_CONFIGS[currentDialogId.value] : undefined));

    // Called by the close button, by Escape, and by a dialog that has finished its own work, so it has to be safe to
    // call when there is nothing open. A body that commits and then unmounts would otherwise navigate twice.
    function closeDialog(): void {
        if (route.query.dlg == null) return;

        const query = { ...route.query };
        delete query.dlg;
        void ignoreReportedNavigationFailure(router.push({ query }));
    }

    // Awaitable, because a menu that opens a dialog should close only once the URL carries it. A failed navigation is
    // caught here, so the caller carries on either way.
    async function openDialog(dialogId: DialogId): Promise<void> {
        await ignoreReportedNavigationFailure(router.replace({ query: { ...route.query, dlg: dialogId } }));
    }

    return { currentDialogConfig, currentDialogId, closeDialog, openDialog };
}
