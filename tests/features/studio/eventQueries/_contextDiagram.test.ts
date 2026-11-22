// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import contextConfigData from '@/features/studio/setup/context/_data/contextConfig.json';
import { constructContextDiagramData, constructContextSearchEntries } from '@/features/studio/eventQueries/_contextDiagram';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_CONFIG = {
    id: 'context',
    label: { en: 'Context', es: 'Contexto' },
    description: {},
    areas: [
        { id: 'fdn', label: { en: 'Foundation', es: 'Fundamentos' }, description: {}, models: [{ id: 'general', label: { en: 'General', es: 'General' }, description: {} }] },
        {
            id: 'hr',
            label: { en: 'Human Resource', es: 'Recursos humanos' },
            description: {},
            models: [
                { id: 'workforce', label: { en: 'Workforce', es: 'Plantilla' }, description: {} },
                { id: 'learning', label: { en: 'Learning', es: 'Formación' }, description: {} }
            ]
        }
    ]
} as unknown as ContextConfig;

// Labels are locale maps, except where the context data gives a plain string, as 'Birth' is here.
const WORKFORCE_MODEL_CONFIG = {
    entities: [
        {
            id: 'person',
            label: { en: 'Person', es: 'Persona' },
            events: [
                { id: 'activation', labelAction: 'Birth' },
                { id: 'deletion', labelAction: { en: 'Deletion', es: 'Eliminación' } }
            ]
        },
        { id: 'job', label: { en: 'Job', es: 'Puesto' }, events: [] }
    ]
} as unknown as ContextModelConfig;

const PERSON_BIRTH_REFERENCE = { areaId: 'hr', modelId: 'workforce', entityId: 'person', eventId: 'activation' };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructContextDiagramData', () => {
    it('shows the context with its areas, and none of their models, when nothing is focused', () => {
        const data = constructContextDiagramData(CONTEXT_CONFIG, 'en', {});

        expect(data.nodes).toStrictEqual([
            { id: 'context', label: 'Context', level: 0, typeId: 'context' },
            { id: 'context.fdn', label: 'Foundation', level: 1, typeId: 'area', areaId: 'fdn' },
            { id: 'context.hr', label: 'Human Resource', level: 1, typeId: 'area', areaId: 'hr' }
        ]);
        expect(data.links).toStrictEqual([
            { source: 'context', target: 'context.fdn' },
            { source: 'context', target: 'context.hr' }
        ]);
    });

    it('keeps the context and the focused area, hides the other areas and shows the area’s models', () => {
        const data = constructContextDiagramData(CONTEXT_CONFIG, 'es', { areaId: 'hr' });

        expect(data.nodes).toStrictEqual([
            { id: 'context', label: 'Contexto', level: 0, typeId: 'context' },
            { id: 'context.hr', label: 'Recursos humanos', level: 1, typeId: 'area', areaId: 'hr' },
            { id: 'context.hr.workforce', label: 'Plantilla', level: 2, typeId: 'model', areaId: 'hr', modelId: 'workforce' },
            { id: 'context.hr.learning', label: 'Formación', level: 2, typeId: 'model', areaId: 'hr', modelId: 'learning' }
        ]);
        expect(data.links).toStrictEqual([
            { source: 'context', target: 'context.hr' },
            { source: 'context.hr', target: 'context.hr.workforce' },
            { source: 'context.hr', target: 'context.hr.learning' }
        ]);
    });

    it('keeps the path to the focused model, hides the other models and shows the model’s entities without their events', () => {
        const data = constructContextDiagramData(CONTEXT_CONFIG, 'es', { areaId: 'hr', modelId: 'workforce' }, WORKFORCE_MODEL_CONFIG);

        expect(data.nodes).toStrictEqual([
            { id: 'context', label: 'Contexto', level: 0, typeId: 'context' },
            { id: 'context.hr', label: 'Recursos humanos', level: 1, typeId: 'area', areaId: 'hr' },
            { id: 'context.hr.workforce', label: 'Plantilla', level: 2, typeId: 'model', areaId: 'hr', modelId: 'workforce' },
            { id: 'context.hr.workforce.person', label: 'Persona', level: 3, typeId: 'entity', areaId: 'hr', modelId: 'workforce', entityId: 'person' },
            { id: 'context.hr.workforce.job', label: 'Puesto', level: 3, typeId: 'entity', areaId: 'hr', modelId: 'workforce', entityId: 'job' }
        ]);
        expect(data.links).toContainEqual({ source: 'context.hr.workforce', target: 'context.hr.workforce.person' });
    });

    it('keeps the path to the focused entity, hides the other entities and shows the entity’s events', () => {
        const data = constructContextDiagramData(CONTEXT_CONFIG, 'es', { areaId: 'hr', modelId: 'workforce', entityId: 'person' }, WORKFORCE_MODEL_CONFIG);

        expect(data.nodes.slice(3)).toStrictEqual([
            { id: 'context.hr.workforce.person', label: 'Persona', level: 3, typeId: 'entity', areaId: 'hr', modelId: 'workforce', entityId: 'person' },
            { id: 'context.hr.workforce.person.activation', label: 'Birth', level: 4, typeId: 'event', contextEventReference: PERSON_BIRTH_REFERENCE, entityLabel: 'Persona' },
            {
                id: 'context.hr.workforce.person.deletion',
                label: 'Eliminación',
                level: 4,
                typeId: 'event',
                contextEventReference: { ...PERSON_BIRTH_REFERENCE, eventId: 'deletion' },
                entityLabel: 'Persona'
            }
        ]);
        expect(data.links).toContainEqual({ source: 'context.hr.workforce.person', target: 'context.hr.workforce.person.activation' });
    });

    it('shows a focused entity with nothing below it when it has no events', () => {
        const data = constructContextDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'hr', modelId: 'workforce', entityId: 'job' }, WORKFORCE_MODEL_CONFIG);

        expect(data.nodes.map((node) => node.typeId)).toStrictEqual(['context', 'area', 'model', 'entity']);
    });

    it('gives a node the same id at every level, so a diagram can keep it in place while the level changes', () => {
        const levels = [{}, { areaId: 'hr' }, { areaId: 'hr', modelId: 'workforce' }, { areaId: 'hr', modelId: 'workforce', entityId: 'person' }].map((focus) =>
            constructContextDiagramData(CONTEXT_CONFIG, 'en', focus, WORKFORCE_MODEL_CONFIG)
        );

        expect(levels.every((data) => data.nodes.some((node) => node.id === 'context.hr'))).toBe(true);
    });

    it('shows a focused model with nothing below it while its data has not loaded, or when it has none', () => {
        expect(constructContextDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'hr', modelId: 'workforce' }).nodes.map((node) => node.typeId)).toStrictEqual([
            'context',
            'area',
            'model'
        ]);
        expect(constructContextDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'hr', modelId: 'workforce' }, null).nodes).toHaveLength(3);
    });

    it('falls back to the level above for an area, model or entity the context does not have', () => {
        expect(constructContextDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'gone' })).toStrictEqual(constructContextDiagramData(CONTEXT_CONFIG, 'en', {}));
        expect(constructContextDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'hr', modelId: 'gone' })).toStrictEqual(
            constructContextDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'hr' })
        );
        expect(constructContextDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'hr', modelId: 'workforce', entityId: 'gone' }, WORKFORCE_MODEL_CONFIG)).toStrictEqual(
            constructContextDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'hr', modelId: 'workforce' }, WORKFORCE_MODEL_CONFIG)
        );
    });

    it('links only nodes that exist, with unique ids, at each level of the app’s own context', () => {
        const contextConfig = contextConfigData as ContextConfig;
        const focuses = [{}, ...contextConfig.areas.map((areaConfig) => ({ areaId: areaConfig.id }))];

        for (const focus of focuses) {
            const data = constructContextDiagramData(contextConfig, 'en', focus);
            const nodeIds = new Set(data.nodes.map((node) => node.id));
            expect(nodeIds.size).toBe(data.nodes.length);
            expect(data.links.every((link) => nodeIds.has(link.source) && nodeIds.has(link.target))).toBe(true);
        }
    });
});

describe('constructContextSearchEntries', () => {
    it('lists every area and model, and the entities and events of each model whose data is given', () => {
        const entries = constructContextSearchEntries(CONTEXT_CONFIG, 'en', new Map([['workforce', WORKFORCE_MODEL_CONFIG]]));

        expect(entries.map((entry) => `${entry.typeId}:${entry.id}`)).toStrictEqual([
            'area:fdn',
            'model:fdn.general',
            'area:hr',
            'model:hr.workforce',
            'entity:hr.workforce.person',
            'event:hr.workforce.person.activation',
            'event:hr.workforce.person.deletion',
            'entity:hr.workforce.job',
            'model:hr.learning'
        ]);
    });

    it('gives an event the names of what it belongs to, and the reference a new event query needs', () => {
        const entries = constructContextSearchEntries(CONTEXT_CONFIG, 'es', new Map([['workforce', WORKFORCE_MODEL_CONFIG]]));

        expect(entries.find((entry) => entry.id === 'hr.workforce.person.activation')).toStrictEqual({
            id: 'hr.workforce.person.activation',
            typeId: 'event',
            areaId: 'hr',
            areaLabel: 'Recursos humanos',
            modelId: 'workforce',
            modelLabel: 'Plantilla',
            entityId: 'person',
            entityLabel: 'Persona',
            contextEventReference: PERSON_BIRTH_REFERENCE,
            eventLabel: 'Birth'
        });
    });
});
