// External dependencies
import type { ComponentPublicInstance } from 'vue';

// DPU framework
import type { DPUError } from '@datapos/datapos-shared/errors';

// Log error to console function ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// Log exception function ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

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

// Show error safely function ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function showErrorSafely(error: unknown): void {
    // Insert error message into the body of the page
    const errorDiv = globalThis.document.createElement('div');
    errorDiv.textContent = `Application failed to load: ${error instanceof Error ? error.message : String(error)}`;
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '0';
    errorDiv.style.left = '0';
    errorDiv.style.width = '100vw';
    errorDiv.style.background = '#b91c1c';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '1.5rem';
    errorDiv.style.fontSize = '1.25rem';
    errorDiv.style.zIndex = '9999';
    errorDiv.style.fontFamily = 'monospace, monospace';
    globalThis.document.body.append(errorDiv);

    // TODO: Attempt to send to error tracker...
    try {
    } catch {}

    // TODO: Check pending exceptions for any entries, display on page and attempt to send to error tracker...
}
