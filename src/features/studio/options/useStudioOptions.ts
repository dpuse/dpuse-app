// ── External Dependencies & Registrations
import { useCssVar } from '@vueuse/core';
import { useRoute } from 'vue-router';
import { computed, type ComputedRef, watchEffect } from 'vue';

// ── DPUse Framework
import { type LocaleDescription, type LocaleLabel, localiseConfigs, type LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { localeId } from '@/state/locale';
import { appearanceIsDark, resolveAppearanceIcon } from '@/state/appearance';

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

const GREY_CHANNEL_SPREAD = 16; // Out of 255. Setup's icon greys differ by 9 between channels, and the coloured icons by 70 or more.
const RING_COLOR_PERCENT = 45; // How much of an option's colour a ring keeps.
const RING_COLOR_PERCENT_DARK = 65; // More in the dark appearance, where a ring mixed that far into the near-black background is too faint to see.

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
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="1.38 1.38 21.25 21.25" fill="none" stroke="#bc904d" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-activity-icon lucide-activity"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>',
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
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2.42 1.39 19.16 21.21" fill="none" stroke="#a1a1aa" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>',
        step: 0,
        tasks: []
    }
];

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

export function useStudioOptions(): ComputedRef<LocalisedConfig<StudioOptionConfig>[]> {
    return computed(() => localiseConfigs<StudioOptionConfig>(STUDIO_OPTION_CONFIGS, localeId.value));
}

// Tints every selection on the page with the colour of the studio option on screen, so each part of the app keeps its
// own colour: blue in Data Views, gold in Contextualise Data, teal in Presentations and Data Apps, and grey in Setup.
// The colour goes on the page's root element as '--option-color', which the selected colours in 'theme.css' read, so
// menus and dialogs moved to the body are tinted too. With no option on screen, or one whose icon is grey, there is no
// colour, and selections take the theme's own lighter grey. The option is taken from the first path segment, as the
// option bar takes it, so it holds on the pages beneath.
export function useStudioOptionTint(): void {
    const route = useRoute();
    const optionColor = useCssVar('--option-color', document.documentElement);
    watchEffect(() => {
        const optionConfig = STUDIO_OPTION_CONFIGS.find((config) => config.id === route.path.split('/', 2)[1]);
        const iconColor = optionConfig == null ? undefined : readIconColor(resolveAppearanceIcon(optionConfig.icon, optionConfig.iconDark));
        optionColor.value = iconColor != null && isColorGrey(iconColor) ? undefined : iconColor;
        // Names the option too, for the theme rules that set one option's selection apart, such as Data Views' pill blues.
        if (optionConfig == null) delete document.documentElement.dataset.studioOption;
        else document.documentElement.dataset.studioOption = optionConfig.id;
    });
}

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A ring round a diagram node is an option's colour softened towards the pane's background, as the pill's border is a
// soft shade of the pill's text colour. It keeps the option's hue without being as strong as the icon inside it.
export function constructRingColor(color: string | undefined): string | undefined {
    const percent = appearanceIsDark.value ? RING_COLOR_PERCENT_DARK : RING_COLOR_PERCENT;
    return color == null ? undefined : `color-mix(in oklab, ${color} ${String(percent)}%, var(--color-surface))`;
}

// An option's colour is the one its icon is drawn in, because the option configs hold no colour of their own. A
// diagram node then matches the option's button in the bar without the colour being written down twice.
export function readIconColor(icon: string | undefined): string | undefined {
    return icon == null ? undefined : /stroke="(#[\da-f]{3,8})"/i.exec(icon)?.[1];
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A six-digit hex colour whose red, green and blue are nearly equal has no hue to tint a selection with.
function isColorGrey(color: string): boolean {
    const channels = [1, 3, 5].map((start) => Number.parseInt(color.slice(start, start + 2), 16));
    return Math.max(...channels) - Math.min(...channels) < GREY_CHANNEL_SPREAD;
}
