// ── DPUse Framework
import { type AppError, type SerialisedError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { trackEventImmediately } from '@/observability/eventTracking';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function logError(error: unknown): void {
    const serialisedError = serialiseError(error);
    logErrorToConsole(serialisedError);
}

export function reportFatalError(error: unknown): void {
    // Insert error message into the body of the page
    const errorDiv = document.createElement('div');
    errorDiv.textContent = `Application failed to load: ${error instanceof Error ? error.message : String(error)}`;
    Object.assign(errorDiv.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        background: '#b91c1c',
        color: 'white',
        padding: '1.5rem',
        fontSize: '1.25rem',
        zIndex: '9999',
        fontFamily: 'monospace, monospace'
    });
    document.body.append(errorDiv);

    logErrorToConsole(serialiseError(error));
}

// eslint-disable-next-line unicorn/consistent-boolean-name -- 'reportAppError' logs and delivers; the boolean is a secondary delivery-confirmation result, not this function's core purpose.
export async function reportAppError(error: AppError): Promise<boolean> {
    const serialisedErrors = serialiseError(error);
    logErrorToConsole(serialisedErrors);
    return trackEventImmediately('error', { errors: serialisedErrors });
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function logErrorToConsole(serialisedErrors: SerialisedError[]): void {
    console.warn('[dpuse:app] ❌', formatTrace(serialisedErrors));
}

function formatTrace(serialisedErrors: SerialisedError[]): string {
    let message = '';
    let prefix = '';
    for (const serialisedError of serialisedErrors) {
        const responseValue = serialisedError.data == null ? `\n    {} --` : `\n    {} ${JSON.stringify(serialisedError.data)}`;
        const locator = serialisedError.locator ? `\n    in ${serialisedError.locator}` : `\n    in --`;
        const stackOnly = serialisedError.stack?.replace(/^.*\n/, '') ?? '';
        message += `${prefix}${serialisedError.name || 'Error'}: ${serialisedError.message}${responseValue}${locator}\n${stackOnly}`;
        prefix = `\nCaused by: `;
    }
    return message;
}
