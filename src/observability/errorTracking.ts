// DPUse Framework
import { trackEvent } from '@/observability/eventTracking';
import { type AppError, type SerialisedError, serialiseError } from '@datapos/datapos-shared/errors';

// Functions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function logError(error: unknown): void {
    const serialisedError = serialiseError(error);
    logErrorToConsole(serialisedError);
}

export function reportFatalError(error: unknown): void {
    // Insert error message into the body of the page
    const errorDiv = globalThis.document.createElement('div');
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
    globalThis.document.body.append(errorDiv);

    logErrorToConsole(serialiseError(error));
}

export function reportAppError(error: AppError): void {
    const serialisedErrors = serialiseError(error);
    logErrorToConsole(serialisedErrors);
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function logErrorToConsole(serialisedErrors: SerialisedError[]): void {
    console.log('[dpuse:app] ❌', formatTrace(serialisedErrors));
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
