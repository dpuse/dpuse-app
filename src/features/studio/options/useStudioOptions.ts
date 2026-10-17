// ── External Dependencies & Registrations
import { computed, type ComputedRef } from 'vue';

// ── DPUse Framework
import { type LocaleDescription, type LocaleLabel, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localeId } from '@/state/locale';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface StudioOptionConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleDescription;
    icon: string;
    iconDark: null | string;
    step: number;
    tasks: StudioOptionTaskConfig[];
}

interface StudioOptionTaskConfig {
    id: string;
    label: LocaleLabel;
    description: LocaleDescription;
}

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const STUDIO_OPTION_CONFIGS: StudioOptionConfig[] = [
    {
        id: 'dataViews',
        label: { en: 'Establish Data Views', es: 'Establecer vistas de datos' },
        description: {
            en: 'Connect to a data source, such as a file store, database or business application, and choose the item you want to work with. Check its content and column types, then filter, group and sort it into a clean table that the rest of the workflow can use.',
            es: 'Conéctate a una fuente de datos, como un almacén de archivos, una base de datos o una aplicación empresarial, y elige el elemento con el que quieres trabajar. Revisa su contenido y los tipos de columna, y después fíltralo, agrúpalo y ordénalo en una tabla limpia que el resto del flujo de trabajo pueda utilizar.'
        },
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2.37 1.38 20.25 21.26" fill="none" stroke="#5686d6" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-database-zap-icon lucide-database-zap"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 15 21.84"/><path d="M21 5V8"/><path d="M21 12L18 17H22L19 22"/><path d="M3 12A9 3 0 0 0 14.59 14.87"/></svg>',
        iconDark: null,
        step: 1,
        tasks: []
    },
    {
        id: 'eventQueries',
        label: { en: 'Contextualise Data', es: 'Contextualizar datos' },
        description: {
            en: 'Bring data from several views together by mapping it to the events in a context model, such as a hire, a sale or a support case. Data from different systems then shares one meaning, so it can be combined and compared.',
            es: 'Reúne datos de varias vistas asignándolos a los eventos de un modelo de contexto, como una contratación, una venta o un caso de soporte. Así, los datos de distintos sistemas comparten un mismo significado y pueden combinarse y compararse.'
        },
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="1.38 2.38 21.25 19.25" fill="none" stroke="#bc904d" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-audio-lines-icon lucide-audio-lines"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>',
        iconDark: null,
        step: 2,
        tasks: []
    },
    {
        id: 'presentations',
        label: { en: 'Explore Presentations', es: 'Explorar presentaciones' },
        description: {
            en: 'See your results straight away through ready-made presentations, such as charts, tables and summaries. Each presentation is supplied by a presenter, so new ways of viewing your data can be added without changing the workflow.',
            es: 'Ve tus resultados al instante mediante presentaciones predefinidas, como gráficos, tablas y resúmenes. Cada presentación la proporciona un presentador, por lo que se pueden añadir nuevas formas de ver los datos sin cambiar el flujo de trabajo.'
        },
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="1.58 2.59 20.83 19.04" fill="none" stroke="#488f86" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-telescope-icon lucide-telescope"><path d="m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44"/><path d="m13.56 11.747 4.332-.924"/><path d="m16 21-3.105-6.21"/><path d="M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z"/><path d="m6.158 8.633 1.114 4.456"/><path d="m8 21 3.105-6.21"/><circle cx="12" cy="13" r="2"/></svg>',
        iconDark: null,
        step: 3,
        tasks: []
    },
    {
        id: 'dataApps',
        label: { en: 'Build Data Apps', es: 'Crear aplicaciones de datos' },
        description: {
            en: 'Follow step-by-step recipes and tutorials to turn your prepared data into applications of your own, using cookbooks for tools such as Metabase.',
            es: 'Sigue recetas y tutoriales paso a paso para convertir tus datos preparados en tus propias aplicaciones, usando recetarios para herramientas como Metabase.'
        },
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="1.38 1.38 21.25 21.25" fill="none" stroke="#488f86" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-blocks-icon lucide-blocks"><path d="M10 22V7a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5a1 1 0 0 0-1-1H2"/><rect x="14" y="2" width="8" height="8" rx="1"/></svg>',
        iconDark: null,
        step: 0,
        tasks: []
    },
    {
        id: 'setup',
        label: { en: 'Manage Configuration', es: 'Gestionar configuración' },
        description: {
            en: 'Set up what the workflow relies on: the connectors that reach your data sources, the context models that give data a shared meaning, and the presenters, cookbooks and tools available to you.',
            es: 'Configura aquello en lo que se basa el flujo de trabajo: los conectores que acceden a tus fuentes de datos, los modelos de contexto que dan a los datos un significado común, y los presentadores, recetarios y herramientas disponibles.'
        },
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2.42 1.39 19.16 21.21" fill="none" stroke="#52525b" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>',
        iconDark:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2.42 1.39 19.16 21.21" fill="none" stroke="#d4d4d8" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>',
        step: 0,
        tasks: []
    }
];

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useStudioOptions(): ComputedRef<LocalisedConfig<StudioOptionConfig>[]> {
    return computed(() => localiseConfigs<StudioOptionConfig>(STUDIO_OPTION_CONFIGS, localeId.value));
}
