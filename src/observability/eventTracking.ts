// External dependencies
import type { ComponentPublicInstance } from 'vue';
import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// DPU framework
import type { DPUError } from '@datapos/datapos-shared/errors';

// App core
import { version } from '~/package.json';

// Constants
const DPU_API_HOST = 'api.datapos.app';

// Tracked identity for event attribution
let activeSessionId: string | undefined;
let activeUserId: string | undefined;
const pendingEvents: Record<string, unknown>[] = [];

export function initialise(userId?: string, sessionId?: string, emailAddress?: string): void {
    onLCP(trackWebVitalMetric);
    onINP(trackWebVitalMetric);
    onCLS(trackWebVitalMetric);
    onFCP(trackWebVitalMetric);
    onTTFB(trackWebVitalMetric);

    if (userId != null && sessionId != null) identifyUser(userId, sessionId, emailAddress);
}

setInterval(flushEvents, 5000);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) flushEvents();
});

async function flushEvents(): Promise<void> {
    if (pendingEvents.length === 0) return;
    navigator.sendBeacon(`https://${DPU_API_HOST}/events`, JSON.stringify({ events: pendingEvents.splice(0), userAgentString: navigator.userAgent })); // Fails silently if browser cannot queue request
}

type EventTypeId = 'error' | 'interaction' | 'page' | 'performance';
function trackEvent(typeId: EventTypeId, data: Record<string, unknown>): void {
    pendingEvents.push({
        typeId,
        asAt: Date.now(),
        appVersion: version,
        sessionId: activeSessionId,
        userId: activeUserId,
        spanId: undefined,
        referrer: document.referrer,
        url: globalThis.location.href,
        ...data
    });
}

function trackWebVitalMetric(metric: Metric): void {
    trackEvent('performance', {
        name: metric.name,
        navigationType: metric.navigationType,
        perfDelta: metric.delta,
        perfRating: metric.rating,
        perfValue: metric.value
    });
}

export function identifyUser(userId: string, sessionId: string, emailAddress?: string): void {
    activeUserId = userId;
    activeSessionId = sessionId;
}

export function deidentifyUser(): void {
    activeUserId = undefined;
    activeSessionId = undefined;
}

// Error logging ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type HandledException = { typeId: 'handled'; payload: { error?: unknown; locator: string } };
type UnhandledVueException = { typeId: 'unhandledVue'; payload: { error?: unknown; instance: ComponentPublicInstance | null; info?: string } };
type UnhandledRuntimeException = { typeId: 'unhandledRuntime'; payload: ErrorEvent };
type UnhandledPromiseRejectException = { typeId: 'unhandledPromise'; payload: PromiseRejectionEvent };
type Exception = HandledException | UnhandledRuntimeException | UnhandledPromiseRejectException | UnhandledVueException;

export function logException(exception: Exception): void {
    let exceptionError;
    let exceptionProperties;
    switch (exception.typeId) {
        case 'unhandledVue': {
            const payload = exception.payload;
            exceptionError = payload.error instanceof Error ? payload.error : new Error('Unknown Vue error.');
            const options = payload.instance?.$options ?? {};
            exceptionProperties = {
                dpu_exception_type_id: exception.typeId,
                dpu_exception_component_name: options.__name,
                dpu_exception_info: payload.info
            };
            break;
        }
        case 'unhandledRuntime': {
            const payload = exception.payload;
            exceptionError = payload.error instanceof Error ? payload.error : new Error(payload.message || 'Unknown runtime error.');
            exceptionProperties = {
                dpu_exception_type_id: 'runtime',
                dpu_exception_source_filename: payload.filename,
                dpu_exception_source_lineno: payload.lineno,
                dpu_exception_source_colno: payload.colno,
                dpu_exception_original_message: payload.message,
                dpu_exception_has_native_error: payload.error instanceof Error
            };
            break;
        }
        case 'unhandledPromise': {
            const payload = exception.payload;
            exceptionError = payload.reason instanceof Error ? payload.reason : new Error(`Unhandled promise rejection - ${String(payload.reason)}.`);
            exceptionProperties = {
                dpu_exception_type_id: exception.typeId,
                dpu_exception_reason: payload.reason
            };
            break;
        }
        default: {
            const payload = exception.payload;
            exceptionError = payload.error instanceof Error ? payload.error : new Error('Unknown handled error.');
            exceptionProperties = {
                dpu_exception_type_id: exception.typeId,
                dpu_exception_locator: payload.locator
            };
            break;
        }
    }
    // const result = posthog.captureException(exceptionError, exceptionProperties);
    if (import.meta.env.DEV) console.info('[dpu:app] ❌', exceptionError, exceptionProperties /*, result*/);
}

// ???
export function logErrorToConsole(error: unknown): void {
    let message = '';
    let prefix = '';
    let cause = error;
    while (cause != null) {
        if (cause instanceof Error) {
            const stackOnly = cause.stack?.replace(/^.*\n/, '') ?? '';
            if ('locator' in cause) {
                const error_ = cause as DPUError;
                message += `${prefix}${error_.name}: ${error_.message}${error_.locator ? `\n    in ${error_.locator}` : ''}\n${stackOnly}\n`;
            } else {
                message += `${prefix}${cause.name}: ${cause.message}\n${stackOnly}\n`;
            }
        } else {
            message += `${prefix}${String(cause)}\n`;
        }
        prefix = 'Caused by: ';
        cause = cause instanceof Error ? cause.cause : undefined;
    }
    if (import.meta.env.DEV) console.info('[dpu:app] ❌', message);
}
