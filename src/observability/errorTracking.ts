// ── DPUse Framework
import { type AppError, type SerialisedError, serialiseError } from '@dpuse/dpuse-shared/errors';

// ── Local Framework
import { hasFault } from '@/observability/faultInjection';
import { trackEventImmediately } from '@/observability/eventTracking';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Token fallbacks for the fatal error banner. The banner has to render when the application failed to bootstrap, which
// includes the case where 'main.css' never loaded and no design token resolves — so every token below is read with a
// literal fallback rather than trusted. Values mirror 'main.css'; keep them in step with it.
const FATAL_BANNER_COLORS = {
    dark: { buttonBackground: 'rgb(212 212 216 / 20%)', buttonText: '#d4d4d8', danger: 'rgb(248 113 113 / 10%)', dangerRing: '#f87171', dangerText: '#f87171', surface: '#09090b' },
    light: { buttonBackground: '#f4f4f5', buttonText: '#3f3f46', danger: '#fef2f2', dangerRing: '#dc2626', dangerText: '#b91c1c', surface: '#ffffff' }
};
const FATAL_BANNER_FONT_FAMILY = "'Inter Variable', system-ui, -apple-system, sans-serif";

// Lucide's 'triangle-alert', inlined so the banner needs no icon component.
const FATAL_BANNER_ICON_ATTRIBUTES = { fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '1.5', viewBox: '0 0 24 24' };
const FATAL_BANNER_ICON_PATHS = ['m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3', 'M12 9v4', 'M12 17h.01'];

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function logError(error: unknown): void {
    const serialisedError = serialiseError(error);
    logErrorToConsole(serialisedError);
}

export function reportFatalError(error: unknown): void {
    displayFatalErrorBanner(`Application failed to load: ${error instanceof Error ? error.message : String(error)}`);
    logErrorToConsole(serialiseError(error));
}

// eslint-disable-next-line unicorn/consistent-boolean-name -- 'reportAppError' logs and delivers; the boolean is a secondary delivery-confirmation result, not this function's core purpose.
export async function reportAppError(error: AppError): Promise<boolean> {
    const serialisedErrors = serialiseError(error);
    logErrorToConsole(serialisedErrors);
    // Combine with any other fault to see how a display words an undelivered report.
    if (import.meta.env.DEV && hasFault('report')) return false;
    return trackEventImmediately('error', { errors: serialisedErrors });
}

// ── Helpers - Fatal Error Banner ─────────────────────────────────────────────────────────────────────────────────────

// Deliberately raw DOM rather than a component: this runs because the application failed to bootstrap, so Vue may
// never have mounted. It mirrors 'ServiceFailureBanner.vue' — a tab hanging from the top edge — but cannot share code
// with it for the same reason. Styles are applied through CSSOM ('element.style') rather than an injected '<style>'
// element or a 'style' attribute, both of which the production CSP blocks without a hash.
function displayFatalErrorBanner(message: string): void {
    // Set by an inline script in 'index.html' before this module runs, so it is readable even if nothing else loaded.
    const colors = document.documentElement.classList.contains('dark') ? FATAL_BANNER_COLORS.dark : FATAL_BANNER_COLORS.light;

    // Spans the viewport only to centre the tab, so it lets pointer events through to whatever did manage to render.
    const row = document.createElement('div');
    Object.assign(row.style, {
        display: 'flex',
        justifyContent: 'center',
        left: '0',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        pointerEvents: 'none',
        position: 'fixed',
        right: '0',
        top: 'env(safe-area-inset-top)',
        zIndex: '9999'
    });

    const tint = `var(--danger, ${colors.danger})`;
    const tab = document.createElement('div');
    Object.assign(tab.style, {
        alignItems: 'center',
        // The tint is translucent in dark mode, so it is painted over an opaque surface rather than set as the
        // background colour — otherwise the page behind it bleeds through. Same approach as 'ServiceFailureBanner'.
        backgroundColor: `var(--surface, ${colors.surface})`,
        backgroundImage: `linear-gradient(${tint}, ${tint})`,
        // Longhands rather than 'border' plus a 'borderTop' reset: these are applied in key order, so any shorthand
        // listed alphabetically after the reset would silently put the top edge back and close the tab off.
        borderBottomLeftRadius: '0.75rem',
        borderBottomRightRadius: '0.75rem',
        borderBottomStyle: 'solid',
        borderBottomWidth: '1px',
        borderColor: `color-mix(in oklab, var(--danger-ring, ${colors.dangerRing}) 40%, transparent)`,
        borderLeftStyle: 'solid',
        borderLeftWidth: '1px',
        borderRightStyle: 'solid',
        borderRightWidth: '1px',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        color: `var(--danger-text, ${colors.dangerText})`,
        display: 'flex',
        fontFamily: FATAL_BANNER_FONT_FAMILY,
        fontSize: '15px',
        gap: '0.75rem',
        maxWidth: '42rem',
        padding: '0.5rem 1rem',
        pointerEvents: 'auto'
    });

    const text = document.createElement('span');
    text.style.minWidth = '0';
    text.textContent = message;

    tab.append(buildFatalErrorBannerIcon(), text, buildFatalErrorBannerRefreshButton(colors));
    row.append(tab);
    document.body.append(row);
}

// Built element by element rather than assigned as markup, so it works with no Trusted Types policy in place — the
// policy is installed during the bootstrap this banner exists to report the failure of.
function buildFatalErrorBannerIcon(): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [name, value] of Object.entries(FATAL_BANNER_ICON_ATTRIBUTES)) svg.setAttribute(name, value);
    Object.assign(svg.style, { flexShrink: '0', height: '2rem', width: '2rem' }); // Matches 'size-8' on the icon in 'ServiceFailureBanner.vue'.

    for (const pathData of FATAL_BANNER_ICON_PATHS) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        svg.append(path);
    }
    return svg;
}

function buildFatalErrorBannerRefreshButton(colors: (typeof FATAL_BANNER_COLORS)['light']): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Refresh';
    Object.assign(button.style, {
        backgroundColor: colors.buttonBackground,
        border: 'none',
        borderRadius: '0.375rem',
        color: colors.buttonText,
        cursor: 'pointer',
        flexShrink: '0',
        fontFamily: FATAL_BANNER_FONT_FAMILY,
        fontSize: '15px',
        lineHeight: '1.5rem',
        padding: '0.375rem 0.75rem'
    });
    button.addEventListener('click', () => {
        location.reload();
    });
    return button;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function logErrorToConsole(serialisedErrors: SerialisedError[]): void {
    console.error('[dpuse:app] ❌', formatTrace(serialisedErrors));
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
