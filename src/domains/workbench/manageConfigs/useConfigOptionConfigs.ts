// ── External Dependencies & Registrations
import { computed, type ComputedRef } from 'vue';

// ── DPUse Framework
import { type LocaleDescription, type LocaleLabel, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared/locale';

// ── Local (App) Framework
import { localeId } from '@/state/locale';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface ConfigOptionConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleDescription;
    icon?: string;
    to: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONFIG_OPTION_CONFIGS: ConfigOptionConfig[] = [
    { id: 'home', label: {}, description: {}, to: 'manageConfigs' },
    {
        id: 'connections',
        label: { en: 'Connections' },
        description: { en: ['Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.'] },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link-icon lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
        to: 'manageConnections'
    },
    {
        id: 'connectors',
        label: { en: 'Connectors' },
        description: { en: ['Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.'] },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-cable-icon lucide-cable"><path d="M17 19a1 1 0 0 1-1-1v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a1 1 0 0 1-1 1z"/><path d="M17 21v-2"/><path d="M19 14V6.5a1 1 0 0 0-7 0v11a1 1 0 0 1-7 0V10"/><path d="M21 21v-2"/><path d="M3 5V3"/><path d="M4 10a2 2 0 0 1-2-2V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a2 2 0 0 1-2 2z"/><path d="M7 5V3"/></svg>',
        to: 'manageConnectors'
    },
    {
        id: 'contexts',
        label: { en: 'Contexts' },
        description: { en: ['Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.'] },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#ca8a04" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-component-icon lucide-component"><path d="M15.536 11.293a1 1 0 0 0 0 1.414l2.376 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/><path d="M2.297 11.293a1 1 0 0 0 0 1.414l2.377 2.377a1 1 0 0 0 1.414 0l2.377-2.377a1 1 0 0 0 0-1.414L6.088 8.916a1 1 0 0 0-1.414 0z"/><path d="M8.916 17.912a1 1 0 0 0 0 1.415l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.415l-2.377-2.376a1 1 0 0 0-1.414 0z"/><path d="M8.916 4.674a1 1 0 0 0 0 1.414l2.377 2.376a1 1 0 0 0 1.414 0l2.377-2.376a1 1 0 0 0 0-1.414l-2.377-2.377a1 1 0 0 0-1.414 0z"/></svg>',
        to: 'manageContexts'
    },
    {
        id: 'presenters',
        label: { en: 'Presenters' },
        description: { en: ['Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.'] },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-presentation-icon lucide-presentation"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m7 21 5-5 5 5"/></svg>',
        to: 'managePresenters'
    },
    {
        id: 'tutorials',
        label: { en: 'Tutorials' },
        description: { en: ['Commodo nec sagittis tortor mauris sed. Turpis tortor quis scelerisque diam id accumsan nullam tempus. Pulvinar etiam lacus volutpat eu.'] },
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-open-icon lucide-book-open"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
        to: 'manageTutorials'
    }
];

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useConfigOptionConfigs(): ComputedRef<LocalisedConfig<ConfigOptionConfig>[]> {
    return computed(() => localiseConfigs<ConfigOptionConfig>(CONFIG_OPTION_CONFIGS, localeId.value));
}
