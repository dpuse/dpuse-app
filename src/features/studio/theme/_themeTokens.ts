// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// A run of colour tokens that 'theme.css' keeps together, separated from the next run by a blank line.
export interface ThemeTokenGroup {
    id: string; // The first token's id. Unique, because each token is defined once.
    note: string | undefined; // The comment that opens the group.
    tokens: ThemeToken[];
}

export interface ThemeToken {
    id: string; // The Tailwind colour name: 'card' for 'bg-card'.
    variableId: string; // The variable that ':root' and '.dark' set. A swatch must read this one, because the '--color-*' token is resolved once at the root and never sees a '.dark' wrapper.
    note: string | undefined;
    lightValue: string | undefined;
    darkValue: string | undefined;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TOKEN_PATTERN = /--color-([\w-]+): var\(--([\w-]+)\);(.*)/g; // The last group is the rest of the line, which may hold a comment.

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Reads the colour tokens straight from 'theme.css', so the theme page lists a new token without being edited.
export function parseThemeTokens(css: string): ThemeTokenGroup[] {
    const uncommentedCss = css.replaceAll(/\/\*[\s\S]*?\*\//g, '');
    const lightValues = readDeclarations(uncommentedCss, /:root\s*\{([^}]*)\}/g);
    const darkValues = readDeclarations(uncommentedCss, /\.dark\s*\{([^}]*)\}/g);
    const tokenBlock = /@theme inline\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

    const groups: ThemeTokenGroup[] = [];
    for (const chunk of tokenBlock.split(/\n\s*\n/)) {
        const tokens = Array.from(chunk.matchAll(TOKEN_PATTERN), ([, id = '', variableId = '', rest = '']) => ({
            id,
            variableId,
            note: tidyComment(/\/\*([^*]*)\*\//.exec(rest)?.[1]),
            lightValue: lightValues.get(variableId),
            darkValue: darkValues.get(variableId)
        }));
        if (tokens.length === 0) continue;
        groups.push({ id: tokens[0].id, note: tidyComment(/^\s*\/\*([\s\S]*?)\*\//.exec(chunk)?.[1]), tokens });
    }
    return groups;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Collects every custom property set in the matching blocks. 'theme.css' has two '.dark' blocks, so later ones add to
// the earlier rather than replace them.
function readDeclarations(css: string, blockPattern: RegExp): Map<string, string> {
    const declarations = new Map<string, string>();
    for (const [, body = ''] of css.matchAll(blockPattern)) {
        for (const declaration of body.split(';')) {
            const separatorIndex = declaration.indexOf(':');
            const name = declaration.slice(0, separatorIndex).trim();
            if (name.startsWith('--')) declarations.set(name.slice(2), declaration.slice(separatorIndex + 1).trim());
        }
    }
    return declarations;
}

function tidyComment(comment: string | undefined): string | undefined {
    const text = comment?.replaceAll(/\s+/g, ' ').trim();
    return text === '' ? undefined : text;
}
