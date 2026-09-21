// ── DPUse Framework
import { type AppError, type SerialisedError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { hasFault } from '@/observability/faultInjection';
import { t } from '@/state/locale';
import { TEXT } from './errorTracking_.json';
import { trackEventImmediately } from '@/observability/eventTracking';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Logs the error to the console and reports it to the DPUse API. Returns false if the report fails, so the error
// message can say so.
export async function hasReportedAppError(error: AppError): Promise<boolean> {
    const serialisedErrors = serialiseError(error);
    logErrorToConsole(serialisedErrors);
    if (import.meta.env.DEV && hasFault('report-failure')) return false; // Fakes a failed report; combine with another fault, e.g. '?fault=panel,report-failure'.
    return trackEventImmediately('error', { errors: serialisedErrors });
}

// Logs the error to the console only. It is not reported to the DPUse API.
export function logError(error: unknown): void {
    const serialisedError = serialiseError(error);
    logErrorToConsole(serialisedError);
}

// Replaces the page with a message when the app fails to start, and logs the error to the console. It is not reported
// to the DPUse API.
export function reportFatalError(error: unknown): void {
    displayFatalErrorMessage(
        [t(TEXT, 'loadFailed.text', { message: error instanceof Error ? error.message : String(error) }), t(TEXT, 'loadFailed.causes.text'), t(TEXT, 'loadFailed.actions.text')],
        true
    );
    logErrorToConsole(serialiseError(error));
}

// Replaces the page with a message saying the browser is too old and which versions DPUse needs. Nothing is logged to
// the console or reported to the DPUse API, as there is no fault to fix and reporting may need features this browser
// lacks.
export function reportUnsupportedBrowser(): void {
    displayFatalErrorMessage(
        [t(TEXT, 'browserUnsupported.text', { browsers: __SUPPORTED_BROWSERS_TEXT__ }), t(TEXT, 'browserUnsupported.reason.text'), t(TEXT, 'browserUnsupported.action.text')],
        false
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Covers the page with a centred message and an optional reload button. Built with plain DOM and system colours, as
// Vue and 'main.css' may not have loaded.
function displayFatalErrorMessage(paragraphs: string[], hasReloadButton: boolean): void {
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
        alignItems: 'center',
        backgroundColor: 'Canvas',
        bottom: '0',
        color: 'CanvasText',
        colorScheme: 'light dark',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, sans-serif',
        justifyContent: 'center',
        left: '0',
        padding: '1rem',
        position: 'fixed',
        right: '0',
        textAlign: 'center',
        top: '0',
        zIndex: '9999'
    });

    // The first paragraph states the error and stands out; the rest explain it.
    for (const [index, paragraph] of paragraphs.entries()) {
        const text = document.createElement('p');
        Object.assign(text.style, { margin: '0 0 0.75rem', maxWidth: '36rem' }, index === 0 ? { fontWeight: '600' } : { opacity: '0.75' });
        text.textContent = paragraph;
        overlay.append(text);
    }

    // Shown only where reloading might help. It cannot fix an unsupported browser.
    if (hasReloadButton) {
        const button = document.createElement('button');
        // Styled as a bold link. Every style is set here, so it looks the same with or without 'main.css'.
        Object.assign(button.style, {
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            font: 'inherit',
            fontWeight: '600',
            marginTop: '0.5rem',
            padding: '0',
            textDecoration: 'underline'
        });
        button.textContent = t(TEXT, 'reload.label');
        button.type = 'button';
        button.addEventListener('click', () => {
            location.reload();
        });
        overlay.append(button);
    }

    document.body.append(overlay);
}

// Logs the error to the console, followed by each error that caused it.
function logErrorToConsole(serialisedErrors: SerialisedError[]): void {
    console.error('[dpuse:app] ❌', formatTrace(serialisedErrors));
}

// Turns the errors into one block of text that is easy to read in the console.
function formatTrace(serialisedErrors: SerialisedError[]): string {
    let message = '';
    let prefix = '';
    for (const serialisedError of serialisedErrors) {
        const responseValue = serialisedError.data == null ? `\n    {} --` : `\n    {} ${JSON.stringify(serialisedError.data)}`;
        const locator = serialisedError.locator ? `\n    in ${serialisedError.locator}` : `\n    in --`;
        const stackOnly = serialisedError.stack?.replace(/^.*\n/, '') ?? ''; // Drops the first line, which repeats the message in Chromium.
        message += `${prefix}${serialisedError.name || 'Error'}: ${serialisedError.message}${responseValue}${locator}\n${stackOnly}`;
        prefix = `\nCaused by: `;
    }
    return message;
}
