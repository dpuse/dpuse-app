// ── External Dependencies & Registrations
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// ── Local Framework
import { parseThemeTokens } from '@/features/studio/theme/_themeTokens';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('parseThemeTokens', () => {
    it('groups tokens by blank line and pairs each with its light and dark values', () => {
        const css = `
            @theme inline {
                --color-surface: var(--surface); /* Content background */

                /* Status ─ for tags. */
                --color-info: var(--info);
            }
            :root { --surface: white; --info: blue; }
            .dark { --surface: black; }
            .dark { --info: navy; }
        `;

        expect(parseThemeTokens(css)).toEqual([
            {
                id: 'surface',
                note: undefined,
                tokens: [{ id: 'surface', variableId: 'surface', note: 'Content background', lightValue: 'white', darkValue: 'black' }]
            },
            { id: 'info', note: 'Status ─ for tags.', tokens: [{ id: 'info', variableId: 'info', note: undefined, lightValue: 'blue', darkValue: 'navy' }] }
        ]);
    });

    it('finds a light and dark value for every token in the app theme', () => {
        const themeCss = readFileSync('src/assets/theme.css', 'utf-8'); // Read from disk, because Vitest turns every CSS import, '?raw' included, into an empty string.
        const tokens = parseThemeTokens(themeCss).flatMap((group) => group.tokens);

        expect(tokens.length).toBeGreaterThan(0);
        expect(tokens.filter((token) => token.lightValue == null || token.darkValue == null)).toEqual([]);
    });
});
