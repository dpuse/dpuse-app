// External Dependencies
import { ref } from 'vue';

// Constants ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export type FlagId = 'es' | 'gb';
export type LocaleId = 'en' | 'es';
export type LocaleLabel = Partial<Record<LocaleId, string>>;
export const SUPPORTED_LANGUAGES: { id: LocaleId; flag: FlagId; label: string }[] = [
    { id: 'en', flag: 'gb', label: 'English' },
    { id: 'es', flag: 'es', label: 'Español' }
];

// Global State ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const localeId = ref<LocaleId>(establishLocaleId());

// Actions ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function localiseConfigs<T>(configs: { id: string; label: LocaleLabel; description: LocaleLabel }[], localeId: LocaleId): T[] {
    return configs.map((config) => ({ ...config, label: config.label[localeId] ?? config.id, description: config.description[localeId] ?? config.id }) as T);
}

export function n(value: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(localeId.value, options).format(value);
}

type Translations = Record<string, Record<LocaleId, string>>;
export function t(translations: Translations, id: keyof Translations, parameters?: Record<string, number | string>): string {
    const text = translations[id]?.[localeId.value] ?? translations[id]?.['en'] ?? id;
    if (parameters) return interpolateParameters(text, parameters);
    return text;
}

// Helpers ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function establishLocaleId(): LocaleId {
    for (const languageId of globalThis.navigator?.languages ?? []) {
        const lower = languageId.toLowerCase();
        if (SUPPORTED_LANGUAGES.some((lang) => lang.id === lower)) return lower as LocaleId;
        const prefix = lower.split('-')[0] as LocaleId;
        if (prefix && SUPPORTED_LANGUAGES.some((lang) => lang.id === prefix)) return prefix;
    }
    return 'en'; // Default to English.
}

function interpolateParameters(text: string, parameters: Record<string, number | string>): string {
    return text.replaceAll(/\{(\w+)\}|\{('.*?')\}/gu, (match, parameterId, fixedString): string => {
        if (fixedString != null) {
            return fixedString.slice(1, -1); // Remove surrounding quotes and return fixed string.
        }
        return parameterId in parameters ? String(parameters[parameterId]) : parameterId; // Return parameter value or parameter identifier if not found.
    });
}
