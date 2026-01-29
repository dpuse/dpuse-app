type ModuleStatesController = { connect: () => void; disconnect: () => void };
type MonitorController = { init: () => void };
type MessageMeta = { requestId?: number };
type WorkerMessage = { type: string; payload?: unknown; meta?: MessageMeta };

let moduleStates: ModuleStatesController | undefined;
let monitor: MonitorController | undefined;

self.addEventListener('message', (event) => {
    void handleMessage(event);
});

async function handleMessage(event: MessageEvent<WorkerMessage>): Promise<void> {
    const { type, payload, meta } = event.data || {};

    switch (type) {
        case 'initialise':
            await handleSessionInit(payload);
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
    self.postMessage({ type: 'event:result', payload: 'test' });
}

function handleSessionTeardown(): void {
    disconnectModuleStates();
}

async function handleEvent(payload: unknown, meta?: MessageMeta): Promise<void> {
    // Placeholder: in a real app you might route to PostHog or your API.
    const result = await simulateEventProcessing(payload);
    self.postMessage({ type: 'event:result', payload: result, meta });
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
