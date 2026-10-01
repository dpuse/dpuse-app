// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { type ShallowRef, shallowRef } from 'vue';

// ── DPUse Framework
import { AppError, loadTool } from '@dpuse/dpuse-shared';
import type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import { toolConfigs } from '@/state/session';
import { useConfigsReady } from '@/services/useConfigsReady';
import { type AppFailure, raiseFailure } from '@/state/errors';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

interface MarkedToolState {
    // The loaded tool, or undefined while loading and after a failed load.
    markedTool: ShallowRef<MarkedTool | undefined>;
    // The failure from the last load attempt, cleared at the start of each attempt.
    failure: ShallowRef<AppFailure | undefined>;
    // Retries the load. Never needed just to get the tool loaded in the first place — 'purifyText' triggers that
    // itself — only useful for a caller that wants to retry after 'failure' is set.
    initialise: () => Promise<MarkedTool | undefined>;
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Module-level, not created per call: the tool is a stateless renderer shared by the whole app, so one load (and one
// failure/retry) serves every consumer instead of each component tree loading and failing independently.
const markedTool = shallowRef<MarkedTool | undefined>();
const failure = shallowRef<AppFailure | undefined>();
const loadPromise = shallowRef<Promise<MarkedTool | undefined>>(); // Ref rather than a plain variable: the lint rules forbid reassigning a top-level variable from inside a function.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Renders markdown to sanitised HTML, or to an empty string before the tool has loaded (or after it's failed to).
// Starts the (idempotent) load itself, so a consumer that only wants rendered text never has to call 'initialise'.
export function purifyText(text: string): string {
    void initialise();
    return markedTool.value ? DOMPurify.sanitize(markedTool.value.render(text)) : '';
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// For a caller that needs the tool itself (not just rendered text) or wants to show its own failure/retry UI.
// 'markedTool', 'failure' and 'initialise' are the same shared instances 'purifyText' uses underneath.
export function useMarkedTool(): MarkedToolState {
    return { markedTool, failure, initialise };
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Idempotent: the first call starts the load and every later call reuses the same in-flight promise. A failed load
// clears the promise, so the next call (a retry, or 'purifyText' on the next render) actually tries again rather than
// replaying the same failure.
function initialise(): Promise<MarkedTool | undefined> {
    if (loadPromise.value) return loadPromise.value;
    failure.value = undefined;
    loadPromise.value = (async (): Promise<MarkedTool | undefined> => {
        try {
            await useConfigsReady();
            markedTool.value = await loadTool<MarkedTool>(toolConfigs.value, 'marked-markdown-parser');
        } catch (error) {
            failure.value = raiseFailure(new AppError('Failed to load markdown formatter.', 'dpuse-app.useMarkedTool.initialise', { typeId: 'handled' }, { cause: error }));
            loadPromise.value = undefined;
        }
        return markedTool.value;
    })();
    return loadPromise.value;
}
