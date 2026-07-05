// External Dependencies & Registrations
import { ref } from 'vue';

// DPUse Framework
import { DEFAULT_LOCALE_ID, type LocaleId, type LocaleLabel, SUPPORTED_LANGUAGES } from '@dpuse/dpuse-shared/locale';

// State ───────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const localeId = ref<LocaleId>(establishLocaleId());

// Actions ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function n(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(localeId.value, options).format(value);
}

type Translations = Record<string, LocaleLabel>;
export function t(translations: Translations, id: keyof Translations, parameters?: Record<string, number | string>): string {
    const text = translations[id]?.[localeId.value] ?? translations[id]?.[DEFAULT_LOCALE_ID] ?? id;
    if (parameters) return interpolateParameters(text, parameters);
    return text;
}

// Helpers ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishLocaleId(): LocaleId {
    for (const languageId of globalThis.navigator?.languages ?? []) {
        const lower = languageId.toLowerCase();
        if (SUPPORTED_LANGUAGES.some((lang) => lang.id === lower)) return lower as LocaleId;
        const prefix = lower.split('-', 1)[0] as LocaleId;
        if (prefix && SUPPORTED_LANGUAGES.some((lang) => lang.id === prefix)) return prefix;
    }
    return DEFAULT_LOCALE_ID;
}

function interpolateParameters(text: string, parameters: Record<string, number | string>): string {
    return text.replaceAll(/\{(\w+)\}|\{('.*?')\}/gu, (match, parameterId, fixedString): string => {
        if (fixedString != null) {
            return fixedString.slice(1, -1); // Remove surrounding quotes and return fixed string.
        }
        return parameterId in parameters ? String(parameters[parameterId]) : parameterId; // Return parameter value or parameter identifier if not found.
    });
}
