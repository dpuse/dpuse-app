// ── External Dependencies & Registrations
import { afterEach, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { localeId, n, t } from '@/state/locale';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TEXT = {
    'greeting.text': { en: 'Hello {name}', es: 'Hola {name}' },
    'english.text': { en: 'Only in English' },
    'brace.text': { en: "Wrap it in {'{'}braces{'}'}" }
};

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The language is chosen once, as the module loads, so this loads it afresh under the browser languages given.
async function loadLocaleId(languages: string[]): Promise<string> {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
    vi.resetModules();
    const locale = await import('@/state/locale');
    return locale.localeId.value;
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('t', () => {
    afterEach(() => {
        localeId.value = 'en';
    });

    it('reads the current language and follows a change to it', () => {
        expect(t(TEXT, 'greeting.text', { name: 'Ana' })).toBe('Hello Ana');

        localeId.value = 'es';
        expect(t(TEXT, 'greeting.text', { name: 'Ana' })).toBe('Hola Ana');
    });

    it('falls back to English where a language has no translation yet', () => {
        localeId.value = 'es';
        expect(t(TEXT, 'english.text')).toBe('Only in English');
    });

    it('shows the key rather than crashing when a key built at run time does not exist', () => {
        expect(t(TEXT as Record<string, { en: string }>, 'missing.text')).toBe('missing.text');
    });

    it('leaves a placeholder with no matching parameter showing its name', () => {
        expect(t(TEXT, 'greeting.text', { other: 'Ana' })).toBe('Hello name');
    });

    it('writes quoted text out as it is, so a translation can include a brace', () => {
        expect(t(TEXT, 'brace.text', {})).toBe('Wrap it in {braces}');
    });
});

describe('n', () => {
    afterEach(() => {
        localeId.value = 'en';
    });

    it('formats a number in the current language', () => {
        expect(n(1234.5)).toBe('1,234.5');

        localeId.value = 'es';
        expect(n(12_345.5)).toBe('12.345,5');
    });
});

describe('localeId', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it('takes the first browser language the app supports', async () => {
        await expect(loadLocaleId(['fr-FR', 'es', 'en'])).resolves.toBe('es');
    });

    it('matches a regional language by its base language', async () => {
        await expect(loadLocaleId(['es-MX'])).resolves.toBe('es');
    });

    it('falls back to English when no browser language is supported', async () => {
        await expect(loadLocaleId(['fr-FR', 'de'])).resolves.toBe('en');
    });
});
