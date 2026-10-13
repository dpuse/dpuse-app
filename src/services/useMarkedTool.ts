// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { type ShallowRef, shallowRef } from 'vue';

// ── DPUse Framework
import type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';
import { AppError, loadTool } from '@dpuse/dpuse-shared';

// ── Local Framework
import { shareLoad } from '@/utilities/index.ts';
import { type AppFailure, raiseFailure } from '@/state/errors';
import { toolConfigs, useConfigsReady } from '@/state/configs';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

interface MarkedToolState {
    markedTool: ShallowRef<MarkedTool | undefined>; // Undefined while loading and after a failed load.
    failure: ShallowRef<AppFailure | undefined>; // From the last load attempt, cleared when the next one starts.
    initialise: () => Promise<MarkedTool | undefined>; // Loads the tool, or retries after 'failure' is set.
}

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Module-level, not created per call: the tool is a stateless renderer shared by the whole app, so one load (and one
// failure/retry) serves every consumer instead of each component tree loading and failing independently.
const markedTool = shallowRef<MarkedTool | undefined>();
const failure = shallowRef<AppFailure | undefined>();
const establishMarkedTool = shareLoad(loadMarkedTool);

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// For a caller that needs the tool itself (not just rendered text) or wants to show its own failure/retry UI.
export function useMarkedTool(): MarkedToolState {
    return { markedTool, failure, initialise };
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Falls back to sanitised plain text while the tool loads or after it fails, so the text is never blank. Starts the
// first load itself but never retries one, because it runs on every render and a retry would report the failure again
// each time.
export function renderMarkdown(text: string): string {
    if (markedTool.value == null && failure.value == null) void initialise();
    return DOMPurify.sanitize(markedTool.value ? markedTool.value.render(text) : text);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function initialise(): Promise<MarkedTool | undefined> {
    try {
        return await establishMarkedTool();
    } catch {
        return markedTool.value; // The failure is already raised and held in 'failure'.
    }
}

async function loadMarkedTool(): Promise<MarkedTool> {
    failure.value = undefined;
    try {
        await useConfigsReady();
        markedTool.value = await loadTool<MarkedTool>(toolConfigs.value, 'marked-markdown-parser');
        return markedTool.value;
    } catch (error) {
        failure.value = raiseFailure(new AppError('Failed to load markdown formatter.', 'dpuse-app.useMarkedTool.loadMarkedTool', { typeId: 'handled' }, { cause: error }));
        throw error;
    }
}
