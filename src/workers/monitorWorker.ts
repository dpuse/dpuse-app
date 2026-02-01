// Vendor dependencies
import { UAParser } from 'ua-parser-js';

// Framework
import type { ModuleConfig } from '@datapos/datapos-shared/component';

// Data
import { version } from '~/package.json';

//
export type WorkerMessage = { typeId: string; payload: WorkerMessagePayload; meta?: { requestId?: number } };
export interface WorkerMessagePayload {
    anonId?: string; // TODO: Move to specific type?
    userId: string;
    sessionId: string;
    browser: { language: string };
    connection: { effectiveType?: string; downlink?: number; downlinkMax?: number; rtt?: number; saveData?: boolean; type?: string };
    document: { referrer: string };
    screen: { height: number; width: number };
    url: { href: string; host: string; pathname: string };
    userAgent: string;
    viewport: { height: number; width: number };
}
export interface WorkerMessageExceptionPayload extends WorkerMessagePayload {
    error: unknown;
}
export interface WorkerMessageWebVitalPayload extends WorkerMessagePayload {
    webVitalMetric: Record<string, unknown>;
}
export type WorkerResponse = { typeId: string; payload: Record<string, unknown>; meta?: { requestId?: number } };

// Constants
const DPU_API_HOST = 'api.datapos.app';
const POSTHOG_CAPTURE_URL = 'https://eu.i.posthog.com/capture';
const TIMEOUT_DELAY = 5000;

let webSocket: WebSocket | undefined;

self.addEventListener('message', (event) => {
    void handleMessage(event);
});

async function handleMessage(event: MessageEvent<WorkerMessage>): Promise<void> {
    const message = event.data;
    if (!message) return;

    const { typeId, payload, meta } = message;
    const requestId = meta?.requestId;

    try {
        let responsePayload: Record<string, unknown> | undefined;
        switch (typeId) {
            case 'initialise':
                await postToPostHog(JSON.stringify(constructPostHogIdentifyBody(payload)), 'initialise');
                await handleSessionInit();
                responsePayload = { ok: true };
                break;
            case 'resetUser':
                await postToPostHog(JSON.stringify(constructPostHogIdentifyBody(payload)), 'resetUser');
                responsePayload = { ok: true };
                break;
            case 'logWebVitals':
                await postToPostHog(JSON.stringify(constructPostHogWebVitalsBody(payload as WorkerMessageWebVitalPayload)), 'logWebVitals');
                responsePayload = { ok: true };
                break;
            case 'logPageView':
                await postToPostHog(JSON.stringify(constructPostHogPageViewBody(payload)), 'logPageView');
                responsePayload = { ok: true };
                break;
            case 'logException':
                await postToPostHog(JSON.stringify(constructPostHogExceptionBody(payload as WorkerMessageExceptionPayload)), 'logException');
                responsePayload = { ok: true };
                break;
            case 'cleanUp':
                handleSessionTeardown();
                responsePayload = { ok: true };
                break;
            default:
                console.debug('[event-worker] unknown message', event.data);
                return;
        }

        postWorkerResult(responsePayload ?? {}, requestId);
    } catch (error) {
        console.error('[event-worker] handler error', error);
        postWorkerError(error, requestId, typeId);
    }
}

async function postToPostHog(body: string, label: string): Promise<void> {
    const options: RequestInit = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body };
    const response = await fetch(POSTHOG_CAPTURE_URL, options);
    console.log(label, await response.text());
}

async function handleSessionInit(): Promise<void> {
    if (webSocket && (webSocket.readyState === WebSocket.CONNECTING || webSocket.readyState === WebSocket.OPEN)) return;
    webSocket = connectToStatesWebSocket();
}

function connectToStatesWebSocket(): WebSocket | undefined {
    try {
        const wsURL = `wss://${DPU_API_HOST}/states/websocket`;
        let statesWebSocket: WebSocket | undefined = new WebSocket(wsURL);

        statesWebSocket.addEventListener('open', () => {
            console.info('[datapos] ✅ App: WebSocket connection established.');
        });

        statesWebSocket.addEventListener('message', (event) => {
            try {
                const eventData = JSON.parse(event.data);
                switch (eventData.typeId) {
                    case 'init':
                        return registerModules(eventData.modules as ModuleConfig[]);
                    case 'deploy':
                        registerModules([eventData.module as ModuleConfig]);
                        return;
                    case 'delete':
                        return unregisterModules([eventData.module as ModuleConfig]);
                }
            } catch (error) {
                console.info(`[datapos] ❌ App: Module registration error: ${error}`);
            }
        });

        statesWebSocket.addEventListener('close', (event) => {
            console.info(`[datapos] ⚠️ App: WebSocket close event '${event.code}' received.`);
            statesWebSocket = undefined;
            setTimeout(connectToStatesWebSocket, TIMEOUT_DELAY);
        });

        statesWebSocket.addEventListener('error', (error) => {
            // TODO: Try and reconnect a limited number of times. If no success then display message requesting refresh.
            console.info(`[datapos] ❌ App: WebSocket operational error: ${error}`);
        });

        return statesWebSocket;
    } catch (error) {
        // TODO: Try and recreate a limited number of times. If no success then display message requesting refresh.
        console.info(`[datapos] ❌ App: WebSocket creation error: ${error}`);
        return undefined;
    }
}

function registerModules(moduleConfigs: ModuleConfig[]): void {
    self.postMessage({ typeId: 'modulesRegistered', payload: moduleConfigs });
}

function unregisterModules(moduleConfigs: ModuleConfig[]): void {
    self.postMessage({ typeId: 'modulesUnregistered', payload: moduleConfigs });
}

function handleSessionTeardown(): void {
    if (!webSocket) return;
    webSocket.close();
    webSocket = undefined; //
}

function postWorkerResult(payload: Record<string, unknown>, requestId?: number) {
    if (requestId === undefined) return;
    self.postMessage({ typeId: 'event:result', payload, meta: { requestId } });
}

function postWorkerError(error: unknown, requestId?: number, sourceTypeId?: string) {
    if (requestId === undefined) return;
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    self.postMessage({
        typeId: 'event:error',
        meta: { requestId },
        payload: {
            message: normalizedError.message,
            stack: normalizedError.stack,
            sourceTypeId
        }
    });
}

// Construct PostHog body helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function constructPostHogIdentifyBody(payload: WorkerMessagePayload) {
    return {
        api_key: import.meta.env.VITE_POSTHOG_PROJECT_API_KEY,
        event: '$identify',
        distinct_id: payload.userId,
        properties: { ...constructPostHogCommonBodyProperties(payload), $set: {}, $set_once: {} }
    };
}

function constructPostHogWebVitalsBody(payload: WorkerMessageWebVitalPayload) {
    return {
        api_key: import.meta.env.VITE_POSTHOG_PROJECT_API_KEY,
        event: '$web_vitals',
        distinct_id: payload.userId,
        properties: { ...constructPostHogCommonBodyProperties(payload), ...constructPostHogWebVitalsBodyProperties(payload.webVitalMetric) }
    };
}

function constructPostHogWebVitalsBodyProperties(webVital: Record<string, unknown>) {
    // TODO: Assign other web vital properties...
    return webVital.name == 'ttfb' ? { ['web_vitals_ttfb_value']: webVital.value } : { [`$web_vitals_${webVital.name}_value`]: webVital.value };
}

function constructPostHogPageViewBody(payload: WorkerMessagePayload) {
    return {
        api_key: import.meta.env.VITE_POSTHOG_PROJECT_API_KEY,
        event: '$pageview',
        distinct_id: payload.userId,
        properties: { ...constructPostHogCommonBodyProperties(payload) }
    };
}

function constructPostHogExceptionBody(payload: WorkerMessageExceptionPayload) {
    return {
        api_key: import.meta.env.VITE_POSTHOG_PROJECT_API_KEY,
        event: '$exception',
        distinct_id: payload.userId,
        properties: { ...constructPostHogCommonBodyProperties(payload), ...constructPostHogExceptionProperties(payload.error) }
    };
}

function constructPostHogExceptionProperties(error: unknown) {
    return {
        $exception_list: [
            {
                type: (error as Error).name || 'Error',
                value: (error as Error).message || 'Unknown error',
                mechanism: { handled: false, type: 'generic', synthetic: false },
                stacktrace: { type: 'raw', frames: parseStack((error as Error).stack) }
            }
        ]
    };
}

// function xxxx(error: unknown) {
//     // Generate or reuse a persistent distinct_id
//     const DISTINCT_ID_KEY = 'posthog_distinct_id';
//     let distinctId = localStorage.getItem(DISTINCT_ID_KEY);
//     if (!distinctId) {
//         distinctId = `anon_${crypto.randomUUID()}`;
//         localStorage.setItem(DISTINCT_ID_KEY, distinctId);
//     }

//     const payload = {
//         event: '$exception',
//         distinct_id: distinctId,
//         properties: {
//             $exception_list: [
//                 {
//                     type: (error as Error).name || 'Error',
//                     value: (error as Error).message || 'Unknown error',
//                     mechanism: { handled: false, type: 'generic', synthetic: false },
//                     stacktrace: { type: 'raw', frames: parseStack((error as Error).stack) }
//                 }
//             ],
//             page_url: globalThis.location.href,
//             browser: navigator.userAgent,
//             timestamp: Date.now()
//         }
//     };

//     fetch('https://eu.i.posthog.com/capture/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ api_key: import.meta.env.VITE_POSTHOG_PROJECT_API_KEY, ...payload })
//     }).catch(console.error);
// }

function constructPostHogCommonBodyProperties(payload: WorkerMessagePayload) {
    const parser = new UAParser(payload.userAgent);
    const result = parser.getResult();
    return {
        $anon_distinct_id: payload.anonId, // ????
        $browser: result.browser.name,
        $browser_version: Number(result.browser.major),
        $browser_language: payload.browser.language,
        $browser_language_prefix: payload.browser.language.split('-')[0],
        browser_version_full: result.browser.version,
        connection_effective_type: payload.connection.effectiveType,
        connection_downlink: payload.connection.downlink,
        connection_downlinkMax: payload.connection.downlinkMax,
        connection_rtt: payload.connection.rtt,
        connection_save_data: payload.connection.saveData,
        connection_type: payload.connection.type,
        $current_url: payload.url.href,
        $device: result.device.model || result.device.type || 'Desktop',
        $device_type: result.device.type || 'Desktop',
        device_vendor: result.device.vendor,
        $device_id: undefined,
        distinct_id: undefined,
        engine: result.engine.name,
        engine_version: result.engine.version,
        $host: payload.url.host,
        $insert_id: crypto.randomUUID(),
        $is_identified: undefined,
        $lib: 'workbench',
        $lib_version: version,
        $os: result.os.name,
        $os_version: result.os.version,
        $pageview_id: undefined,
        $pathname: payload.url.pathname,
        $raw_user_agent: payload.userAgent,
        $referrer: payload.document.referrer,
        $referring_domain: undefined,
        $send_at: undefined,
        $session_id: undefined, // TODO
        $session_entry_url: undefined,
        $session_entry_host: undefined,
        $session_entry_pathname: undefined,
        $session_entry_referrer: undefined,
        $session_entry_referring_domain: undefined,
        $screen_height: payload.screen.height,
        $screen_width: payload.screen.width,
        $timezone: undefined,
        $timezone_offset: undefined,
        $viewport_height: payload.viewport.height,
        $viewport_width: payload.viewport.width,
        $window_id: undefined
    };
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
