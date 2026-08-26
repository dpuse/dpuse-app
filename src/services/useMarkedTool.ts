// ── External Dependencies & Registrations
import DOMPurify from 'dompurify';
import { type Ref, ref, type ShallowRef, shallowRef } from 'vue';

// ── DPUse Framework
import { AppError } from '@dpuse/dpuse-shared/errors';
import { loadTool } from '@dpuse/dpuse-shared/component/module/tool';
import type { Tool as MarkedTool } from '@dpuse/dpuse-tool-marked-markdown-parser';

// ── Local Framework
import { reportAppError } from '@/observability/errorTracking';
import { toolConfigs } from '@/state/session';
import { useConfigsReady } from '@/services/useConfigsReady';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface MarkedToolState {
    // The loaded tool, or undefined while loading and after a failed load.
    markedTool: ShallowRef<MarkedTool | undefined>;
    // The failure from the last 'initialise' call, cleared at the start of each attempt.
    error: ShallowRef<AppError | undefined>;
    // Undefined until the error report completes, so callers can distinguish reporting-pending from failed.
    errorWasReported: Ref<boolean | undefined>;
    // Loads the tool, retaining and reporting any failure. Also serves as the retry action.
    initialise: () => Promise<MarkedTool | undefined>;
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Renders markdown to sanitised HTML, or to an empty string while the tool is unavailable. Takes the tool rather than
// calling 'useMarkedTool' so components that receive it as a prop can render without owning a second load.
export function purifyMarkdown(markedTool: MarkedTool | undefined, text: string): string {
    if (!markedTool) return '';
    return DOMPurify.sanitize(markedTool.render(text));
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Loads the marked markdown tool and owns the resulting state, so consumers only decide how to present a failure
// (ErrorDisplay or a plain-text fallback) rather than repeating the load, report and retry wiring.
//
// Never throws: 'initialise' resolves with the tool, or with undefined once the failure has been reported to 'error'.
export function useMarkedTool(): MarkedToolState {
    const markedTool = shallowRef<MarkedTool | undefined>();
    const loadError = shallowRef<AppError | undefined>();
    const errorWasReported = ref<boolean | undefined>();

    async function initialise(): Promise<MarkedTool | undefined> {
        loadError.value = undefined;
        errorWasReported.value = undefined;
        try {
            await useConfigsReady();
            markedTool.value = await loadTool<MarkedTool>(toolConfigs.value, 'marked-markdown-parser');
        } catch (error) {
            loadError.value = new AppError('Failed to load markdown formatter.', 'dpuse.useMarkedTool.initialise', { typeId: 'handled' }, { cause: error });
            errorWasReported.value = await reportAppError(loadError.value);
        }
        return markedTool.value;
    }

    return { markedTool, error: loadError, errorWasReported, initialise };
}
