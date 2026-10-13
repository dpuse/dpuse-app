// ── External Dependencies & Registrations
import { ref } from 'vue';

// ── DPUse Framework
import { DEFAULT_LOCALE_ID, type LocaleId, type LocaleLabel, SUPPORTED_LANGUAGES } from '@dpuse/dpuse-shared';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

type Translations = Record<string, LocaleLabel>;

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export const localeId = ref<LocaleId>(establishLocaleId());

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function n(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(localeId.value, options).format(value);
}

export function t<T extends Translations>(translations: T, id: keyof T & string, parameters?: Record<string, number | string>): string {
    const translation = translations[id] as LocaleLabel | undefined; // Undefined only when a key is built at run time, so the key is shown rather than crashing.
    const text = translation?.[localeId.value] ?? translation?.[DEFAULT_LOCALE_ID] ?? id;
    return parameters ? interpolateParameters(text, parameters) : text;
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function establishLocaleId(): LocaleId {
    const languageIds = navigator.languages;
    for (const languageId of languageIds) {
        const lower = languageId.toLowerCase();
        if (SUPPORTED_LANGUAGES.some((lang) => lang.id === lower)) return lower as LocaleId;
        const prefix = lower.split('-', 1)[0] as LocaleId;
        if (SUPPORTED_LANGUAGES.some((lang) => lang.id === prefix)) return prefix;
    }
    return DEFAULT_LOCALE_ID;
}

// '{name}' is replaced by the parameter of that name. "{'text'}" is replaced by the text inside the quotes, so a
// translation can include a brace or other character that would otherwise be read as a placeholder.
function interpolateParameters(text: string, parameters: Record<string, number | string>): string {
    return text.replaceAll(/\{(\w+)\}|\{('.*?')\}/gu, (match, parameterId, fixedString): string => {
        if (fixedString != null) {
            return fixedString.slice(1, -1);
        }
        return Object.hasOwn(parameters, parameterId) ? String(parameters[parameterId]) : parameterId;
    });
}
