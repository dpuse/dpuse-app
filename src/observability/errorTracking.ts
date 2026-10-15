// ── DPUse Framework
import { type AppError, type SerialisedError, serialiseError } from '@dpuse/dpuse-shared';

// ── Local Framework
import { TEXT } from './errorTracking_.json';
import { trackEventImmediately } from '@/observability/eventTracking';
import { localeId, t } from '@/state/locale';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Browsers refuse a 'keepalive' request once all of them in flight together pass 64 KB. A report kept under 48 KB
// leaves room for the rest of the event and for queued events.
const MAX_REPORT_BYTES = 48 * 1024;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_STACK_LINES = 10;

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Logs the error to the console and reports it to the DPUse API. Returns false if the report fails, so the error
// message can say so.
export async function hasReportedAppError(error: AppError): Promise<boolean> {
    const serialisedErrors = serialiseError(error);
    logErrorToConsole(serialisedErrors);
    return trackEventImmediately('error', fitReport(serialisedErrors));
}

// Logs the error to the console only. It is not reported to the DPUse API.
export function logError(error: unknown): void {
    const serialisedErrors = serialiseError(error);
    logErrorToConsole(serialisedErrors);
}

// Replaces the page with a message when the app fails to start, and logs the error to the console. It is not reported
// to the DPUse API.
export function showFatalError(error: unknown): void {
    displayFatalErrorMessage(
        [t(TEXT, 'loadFailed.text', { message: error instanceof Error ? error.message : String(error) }), t(TEXT, 'loadFailed.causes.text'), t(TEXT, 'loadFailed.actions.text')],
        true
    );
    logErrorToConsole(serialiseError(error));
}

// Replaces the page with a message saying the browser is too old and which versions DPUse needs. Nothing is logged to
// the console or reported to the DPUse API, as there is no fault to fix and reporting may need features this browser
// lacks.
export function showUnsupportedBrowser(): void {
    displayFatalErrorMessage(
        [t(TEXT, 'browserUnsupported.text', { browsers: formatBrowserList(__SUPPORTED_BROWSERS__) }), t(TEXT, 'browserUnsupported.reason.text'), t(TEXT, 'browserUnsupported.action.text')],
        false
    );
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Trims a report that is too big to send with 'keepalive'. Every stack is cut first, then every error's 'data', and the
// messages last, because the name, message and locator are what identify each error. The console log stays complete.
function fitReport(serialisedErrors: SerialisedError[]): Record<string, unknown> {
    if (measureBytes({ errors: serialisedErrors }) <= MAX_REPORT_BYTES) return { errors: serialisedErrors };

    const trimSteps: ((serialisedError: SerialisedError) => SerialisedError)[] = [
        (serialisedError): SerialisedError => ({ ...serialisedError, stack: serialisedError.stack?.split('\n').slice(0, MAX_STACK_LINES).join('\n') }),
        (serialisedError): SerialisedError => ({ ...serialisedError, data: serialisedError.data == null ? undefined : { isTruncated: true } }),
        (serialisedError): SerialisedError => ({ ...serialisedError, message: serialisedError.message.slice(0, MAX_MESSAGE_LENGTH) })
    ];
    let errors = serialisedErrors;
    for (const trimStep of trimSteps) {
        errors = errors.map((serialisedError) => trimStep(serialisedError));
        if (measureBytes({ errors }) <= MAX_REPORT_BYTES) break;
    }
    return { errors, isTruncated: true };
}

function measureBytes(value: unknown): number {
    return new TextEncoder().encode(JSON.stringify(value)).length;
}

// Covers the page with a centred message and an optional reload button. Built with plain DOM and system colours, as
// Vue and 'main.css' may not have loaded.
function displayFatalErrorMessage(paragraphs: string[], hasReloadButton: boolean): void {
    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'alert'); // Screen readers announce the message as soon as it appears.
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
    const button = hasReloadButton ? document.createElement('button') : undefined;
    if (button) {
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
    button?.focus(); // Keyboard users land on the one thing they can do.
}

// Joins the browser names the way the reader's language does. A browser too old for 'Intl.ListFormat' gets commas.
function formatBrowserList(browsers: string[]): string {
    return 'ListFormat' in Intl ? new Intl.ListFormat(localeId.value, { type: 'disjunction' }).format(browsers) : browsers.join(', ');
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
        const data = serialisedError.data == null ? `\n    {} --` : `\n    {} ${JSON.stringify(serialisedError.data)}`;
        const locator = serialisedError.locator ? `\n    in ${serialisedError.locator}` : `\n    in --`;
        const stackOnly = serialisedError.stack?.replace(/^.*\n/, '') ?? ''; // Drops the first line, which repeats the message in Chromium.
        message += `${prefix}${serialisedError.name || 'Error'}: ${serialisedError.message}${data}${locator}\n${stackOnly}`;
        prefix = `\nCaused by: `;
    }
    return message;
}
