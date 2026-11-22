// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructContextDiagramData } from '@/features/studio/eventQueries/_contextDiagram';
import contextConfigData from '@/features/studio/setup/context/_data/contextConfig.json';

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
                { id: 'general', label: { en: 'General', es: 'General' }, description: {} }
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

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructContextDiagramData', () => {
    it('places the context at the top, its areas next and each area’s models below the area', () => {
        const data = constructContextDiagramData(CONTEXT_CONFIG, 'en', new Map());

        expect(data.nodes).toStrictEqual([
            { id: 'context', label: 'Context', level: 0, typeId: 'context' },
            { id: 'context.fdn', label: 'Foundation', level: 1, typeId: 'area' },
            { id: 'context.fdn.general', label: 'General', level: 2, typeId: 'model', modelId: 'general' },
            { id: 'context.hr', label: 'Human Resource', level: 1, typeId: 'area' },
            { id: 'context.hr.workforce', label: 'Workforce', level: 2, typeId: 'model', modelId: 'workforce' },
            { id: 'context.hr.general', label: 'General', level: 2, typeId: 'model', modelId: 'general' }
        ]);
        expect(data.links).toStrictEqual([
            { source: 'context', target: 'context.fdn' },
            { source: 'context.fdn', target: 'context.fdn.general' },
            { source: 'context', target: 'context.hr' },
            { source: 'context.hr', target: 'context.hr.workforce' },
            { source: 'context.hr', target: 'context.hr.general' }
        ]);
    });

    it('labels the nodes in the language asked for', () => {
        const data = constructContextDiagramData(CONTEXT_CONFIG, 'es', new Map());

        expect(data.nodes.map((node) => node.label)).toStrictEqual(['Contexto', 'Fundamentos', 'General', 'Recursos humanos', 'Plantilla', 'General']);
    });

    it('gives every node of the app’s own context a unique id, and links only nodes that exist', () => {
        const data = constructContextDiagramData(contextConfigData as ContextConfig, 'en', new Map());

        const nodeIds = new Set(data.nodes.map((node) => node.id));
        expect(nodeIds.size).toBe(data.nodes.length);
        expect(data.links.every((link) => nodeIds.has(link.source) && nodeIds.has(link.target))).toBe(true);
    });

    it('adds an opened model’s entities below the model, and each entity’s events below the entity', () => {
        const data = constructContextDiagramData(CONTEXT_CONFIG, 'es', new Map([['context.hr.workforce', WORKFORCE_MODEL_CONFIG]]));

        expect(data.nodes.filter((node) => node.level > 2)).toStrictEqual([
            { id: 'context.hr.workforce.person', label: 'Persona', level: 3, typeId: 'entity' },
            {
                id: 'context.hr.workforce.person.activation',
                label: 'Birth',
                level: 4,
                typeId: 'event',
                contextEventReference: { areaId: 'hr', modelId: 'workforce', entityId: 'person', eventId: 'activation' },
                entityLabel: 'Persona'
            },
            {
                id: 'context.hr.workforce.person.deletion',
                label: 'Eliminación',
                level: 4,
                typeId: 'event',
                contextEventReference: { areaId: 'hr', modelId: 'workforce', entityId: 'person', eventId: 'deletion' },
                entityLabel: 'Persona'
            },
            { id: 'context.hr.workforce.job', label: 'Puesto', level: 3, typeId: 'entity' }
        ]);
        expect(data.links).toContainEqual({ source: 'context.hr.workforce', target: 'context.hr.workforce.person' });
        expect(data.links).toContainEqual({ source: 'context.hr.workforce.person', target: 'context.hr.workforce.person.activation' });
    });

    it('leaves a model that is not open without entities', () => {
        const data = constructContextDiagramData(CONTEXT_CONFIG, 'en', new Map([['context.hr.workforce', WORKFORCE_MODEL_CONFIG]]));

        expect(data.nodes.some((node) => node.id.startsWith('context.fdn.general.'))).toBe(false);
    });
});
