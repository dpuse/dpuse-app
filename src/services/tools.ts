// ── DPUse Framework
import { loadTool } from '@dpuse/dpuse-shared';

// ── Local Framework
import { shareLoad } from '@/utilities/index.ts';
import { toolConfigs, useConfigsReady } from '@/state/configs';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const toolLoadsByToolId = new Map<string, () => Promise<unknown>>();

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Loads each tool once for the whole app. A failure goes to the caller, which reports it in the words of what it was
// doing.
export function establishTool<T>(toolId: string): Promise<T> {
    const loadSharedTool =
        toolLoadsByToolId.get(toolId) ??
        shareLoad(async () => {
            await useConfigsReady();
            return loadTool<T>(toolConfigs.value, toolId);
        });
    toolLoadsByToolId.set(toolId, loadSharedTool);
    return loadSharedTool() as Promise<T>;
}
