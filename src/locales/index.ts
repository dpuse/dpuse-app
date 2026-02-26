// External dependencies
import { ref } from 'vue';

// Constants
const SUPPORTED_LANGUAGE_IDS = new Set(['en', 'es']);

export type LocaleId = 'en' | 'es';
export const localeId = ref<LocaleId>(establishLocaleId());

export function n(value: number, key?: string): string {
    if (import.meta.env.DEV) console.log('n', value, key);
    return String(value);
}

type Translations = Record<string, Record<LocaleId, string>>;
export function t(translations: Translations, id: keyof Translations, parameters?: Record<string, number | string>): string {
    const text = translations[id]?.[localeId.value] ?? id;
    if (parameters) return text ? interpolateParameters(text, parameters) : `??:${id}`;
    return text || `??:${id}`;
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function establishLocaleId(): LocaleId {
    // Check for exact language match.
    for (const languageId of globalThis.navigator.languages) {
        const transformedLanguageId = languageId.toLowerCase() as LocaleId;
        if (SUPPORTED_LANGUAGE_IDS.has(transformedLanguageId)) return transformedLanguageId;
    }

    // Check for neutral language match.
    for (const languageId of globalThis.navigator.languages) {
        const transformedLanguageId = (languageId.split('-')[0]?.toLowerCase() as LocaleId) ?? undefined;
        if (transformedLanguageId && SUPPORTED_LANGUAGE_IDS.has(transformedLanguageId)) return transformedLanguageId;
    }

    return 'en'; // Default to English.
}

function interpolateParameters(text: string, parameters?: Record<string, number | string>): string {
    return text.replaceAll(/\{(\w+)\}|\{('.*?')\}/gu, (match, parameterId, fixedString): string => {
        if (fixedString != null) {
            return fixedString.slice(1, -1); // Remove surrounding quotes and return fixed string.
        }
        return parameters && parameterId in parameters ? String(parameters[parameterId]) : parameterId; // Return parameter value or parameter identifier if not found.
    });
}
