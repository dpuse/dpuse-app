// ── External Dependencies & Registrations
import { ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import type { ModuleConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { configStatus } from '@/state/configs';
import type { useMonitorSocket } from '@/observability/monitorSocket';
import { liveAppVersion, moduleUpdateIsAvailable, newAppVersionIsAvailable } from '@/state/appVersion';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// The socket is replaced, so each test plays the server's part by calling the handlers the config monitor gave it.
const socketOptions = vi.hoisted(() => ({ current: undefined as Parameters<typeof useMonitorSocket>[0] | undefined }));
vi.mock('@/observability/monitorSocket', () => ({
    useMonitorSocket: (options: Parameters<typeof useMonitorSocket>[0]): unknown => {
        socketOptions.current = options;
        return { online: ref(true), open: vi.fn() };
    }
}));

await import('@/observability/configMonitor');

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildModuleConfig(typeId: string, id: string, version: string): ModuleConfig {
    return { id, typeId, version } as unknown as ModuleConfig;
}

function sendModuleList(moduleConfigs: ModuleConfig[]): void {
    socketOptions.current?.onMessage({ typeId: 'init', modules: moduleConfigs });
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('configMonitor', () => {
    afterEach(() => {
        liveAppVersion.value = undefined;
        moduleUpdateIsAvailable.value = false;
    });

    it('shows the failure on each screen that needs the configuration once the socket gives up', () => {
        socketOptions.current?.onFailed?.();

        expect(configStatus.value.typeId).toBe('failed');
        expect(configStatus.value.typeId === 'failed' ? configStatus.value.failure.error.message : undefined).toBe('Unable to connect to DPUse.');
    });

    // Sent as a single deployment, because a full list would become the page's starting module list.
    it('records a newer deployed app version, so the new version notice can show', () => {
        socketOptions.current?.onMessage({ typeId: 'deploy', module: buildModuleConfig('app', 'dpuse-app', '999.0.0') });

        expect(newAppVersionIsAvailable.value).toBe(true);
    });

    // The first list this file sends is the one the page starts with, and every later list is compared against it.
    it('asks for a reload only when a reconnect brings a different module list', () => {
        const toolConfig = buildModuleConfig('tool', 'dpuse-tool-example', '1.0.0');
        sendModuleList([toolConfig]);
        expect(moduleUpdateIsAvailable.value).toBe(false);

        sendModuleList([toolConfig]);
        expect(moduleUpdateIsAvailable.value).toBe(false);

        sendModuleList([buildModuleConfig('tool', 'dpuse-tool-example', '1.0.1')]);
        expect(moduleUpdateIsAvailable.value).toBe(true);
    });

    it('asks for a reload when a module is deployed while the page is open', () => {
        socketOptions.current?.onMessage({ typeId: 'deploy', module: buildModuleConfig('presenter', 'dpuse-presenter-example', '2.0.0') });

        expect(moduleUpdateIsAvailable.value).toBe(true);
    });
});
