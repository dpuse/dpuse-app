import { UAParser } from 'ua-parser-js';

import { version } from '~/package.json';

type ModuleStatesController = { connect: () => void; disconnect: () => void };
type MonitorController = { init: () => void };
type MessageMeta = { requestId?: number };

type WorkerMessage = { eventId: string; payload: WorkerMessagePayload; meta?: MessageMeta };

export interface WorkerMessagePayload {
    userId: string;
    anonId: string;
    sessionId: string;
    connectionEffectiveType: string;
    connectionDownlink: number;
    connectionDownlinkMax: number;
    connectionRTT: number;
    connectionSaveData: boolean;
    connectionType: string;
    browserLanguage: string;
    url: string;
    host: string;
    pathname: string;
    referrer: string;
    screenHeight: number;
    screenWidth: number;
    viewportHeight: number;
    viewportWidth: number;
    userAgent: string;
}

let moduleStates: ModuleStatesController | undefined;
let monitor: MonitorController | undefined;

self.addEventListener('message', (event) => {
    void handleMessage(event);
});

async function handleMessage(event: MessageEvent<WorkerMessage>): Promise<void> {
    const { eventId, payload, meta } = event.data || {};

    switch (eventId) {
        case 'initialise':
            await handleSessionInit(payload);
            break;
        case '$identify':
            console.log('$identify', payload);
            const userId = payload.userId;

            const parser = new UAParser(payload.userAgent);
            const result = parser.getResult();
            console.log(result);

            fetch('https://eu.i.posthog.com/capture/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: import.meta.env.VITE_POSTHOG_PROJECT_API_KEY,
                    event: '$identify',
                    distinct_id: userId,
                    properties: {
                        $insert_id: crypto.randomUUID(),
                        $anon_distinct_id: payload.anonId,
                        $session_id: undefined, // TODO
                        connection_effective_type: payload.connectionEffectiveType,
                        connection_downlink: payload.connectionDownlink,
                        connection_downlinkMax: payload.connectionDownlinkMax,
                        connection_rtt: payload.connectionRTT,
                        connection_save_data: payload.connectionSaveData,
                        connection_type: payload.connectionType,
                        $browser_language: payload.browserLanguage,
                        $current_url: payload.url,
                        $pathname: payload.pathname,
                        $host: payload.host,
                        $referrer: payload.referrer,
                        $browser: result.browser.name,
                        $browser_version: result.browser.major,
                        browser_version_full: result.browser.version,
                        engine: result.engine.name,
                        engine_version: result.engine.version,
                        $device: result.device.model || result.device.type || 'Desktop',
                        $device_type: result.device.type || 'Desktop',
                        device_vendor: result.device.vendor,
                        $os: result.os.name,
                        $os_version: result.os.version,
                        $screen_height: payload.screenHeight,
                        $screen_width: payload.screenWidth,
                        $viewport_height: payload.viewportHeight,
                        $viewport_width: payload.viewportWidth,
                        $lib: 'workbench',
                        $lib_version: version,
                        $user_agent: payload.userAgent,
                        // For $identify events specifically
                        $set: {
                            // mutable user properties
                        },
                        $set_once: {
                            // immutable properties
                        }
                    }
                })
            }).catch(console.error);

            break;
        case 'cleanUp':
            handleSessionTeardown();
            break;
        case 'event':
            await handleEvent(payload, meta);
            break;
        default:
            console.debug('[event-worker] unknown message', event.data);
    }
}

async function handleSessionInit(payload: unknown): Promise<void> {
    await Promise.all([ensureModuleStates(), ensureMonitor()]);
    // Placeholder: store session context or perform handshake with backend
    console.debug('[event-worker] session:init', payload);
    try {
        self.postMessage({ type: 'event:result', payload: 'test' });
    } catch (error) {
        console.log('ERROR', error);
        console.log('PAYLOAD', payload);
    }
}

function handleSessionTeardown(): void {
    disconnectModuleStates();
}

async function handleEvent(payload: unknown, meta?: MessageMeta): Promise<void> {
    // Placeholder: in a real app you might route to PostHog or your API.
    const result = await simulateEventProcessing(payload);
    try {
        self.postMessage({ type: 'event:result', payload: result, meta });
    } catch (error) {
        console.log('ERROR', error);
        console.log('PAYLOAD', payload);
    }
}

async function ensureModuleStates(): Promise<void> {
    if (moduleStates) return;
    // const moduleStatesComposable = await import('@/composables/useModuleStates');
    // moduleStates = moduleStatesComposable.useModuleStates();
    // moduleStates.connect();
}

function disconnectModuleStates(): void {
    moduleStates?.disconnect();
    moduleStates = undefined;
}

async function ensureMonitor(): Promise<void> {
    if (monitor) return;
    // const monitorComposable = await import('@/composables/useMonitor');
    // monitor = monitorComposable.useMonitor();
    // monitor.init();
}

async function simulateEventProcessing(payload: unknown): Promise<{ ack: true; receivedAt: number; payload: unknown }> {
    // Simulate latency you might have when calling into analytics or storage layers.
    await new Promise((resolve) => setTimeout(resolve, 10));
    return { ack: true, receivedAt: Date.now(), payload };
}

function xxxx(error: unknown) {
    // Generate or reuse a persistent distinct_id
    const DISTINCT_ID_KEY = 'posthog_distinct_id';
    let distinctId = localStorage.getItem(DISTINCT_ID_KEY);
    if (!distinctId) {
        distinctId = `anon_${crypto.randomUUID()}`;
        localStorage.setItem(DISTINCT_ID_KEY, distinctId);
    }

    const payload = {
        event: '$exception',
        distinct_id: distinctId,
        properties: {
            $exception_list: [
                {
                    type: (error as Error).name || 'Error',
                    value: (error as Error).message || 'Unknown error',
                    mechanism: { handled: false, type: 'generic', synthetic: false },
                    stacktrace: { type: 'raw', frames: parseStack((error as Error).stack) }
                }
            ],
            page_url: globalThis.location.href,
            browser: navigator.userAgent,
            timestamp: Date.now()
        }
    };

    fetch('https://eu.i.posthog.com/capture/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: import.meta.env.VITE_POSTHOG_PROJECT_API_KEY, ...payload })
    }).catch(console.error);
}

function parseStack(stack?: string) {
    if (!stack) return [];
    const lines = stack.split('\n').slice(1);
    return lines.map((line) => {
        const match = line.match(/at (.*?) \((.*?):(\d+):(\d+)\)/);
        if (!match) return { platform: 'javascript', lang: 'javascript', function: line.trim() || '<anonymous>', in_app: true };
        return {
            platform: 'javascript',
            lang: 'javascript',
            function: match[1] || '<anonymous>',
            filename: match[2],
            lineno: Number.parseInt(match[3] ?? '', 10),
            colno: Number.parseInt(match[4] ?? '', 10),
            in_app: true
        };
    });
}
// const defaultPayload = useWorkbenchContext();
// onCLS((metric) => logEvent(metric, { ...defaultPayload, clsDelta: metric.delta, clsValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
// onINP((metric) => logEvent(metric, { ...defaultPayload, inpDelta: metric.delta, inpValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
// onLCP((metric) => logEvent(metric, { ...defaultPayload, lcpDelta: metric.delta, lcpValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
// onFCP((metric) => logEvent(metric, { ...defaultPayload, fcpDelta: metric.delta, fcpValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));
// onTTFB((metric) => logEvent(metric, { ...defaultPayload, ttfbDelta: metric.delta, ttfbValue: metric.value, navigationType: metric.navigationType, rating: metric.rating }));

// async function logEvent(metric: Metric, data: Record<string, unknown>) {
//     console.log({
//         api_key: 'phc_stFCVM7oIBMHqRDgAkxA7yQq5jbV3SpQfFOTazKGwiq',
//         event: 'web_vitals',
//         properties: {
//             page_url: globalThis.location.href,
//             device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
//             connection_type: (navigator as any).connection?.effectiveType || 'unknown',
//             ...data,
//             timestamp: Date.now()
//         }
//     });
//     // fetch('https://eu.posthog.com/capture/', {
//     //     method: 'POST',
//     //     headers: { 'Content-Type': 'application/json' },
//     //     body: JSON.stringify({
//     //         api_key: 'phc_lsZySXoMlZsSR2dvvUgW0miyzOZvSilsh6i7SC2qYOs',
//     //         event: 'web_vitals',
//     //         distinct_id: 'anonymous_' + Math.random().toString(36).substring(2, 10),
//     //         properties: {
//     //             page_url: globalThis.location.href,
//     //             device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
//     //             connection_type: (navigator as any).connection?.effectiveType || 'unknown',
//     //             ...data,
//     //             timestamp: Date.now()
//     //         }
//     //     })
//     // }).catch(console.error);
// }
