// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructContextSearchEntries } from '@/features/studio/eventQueries/_contextDiagram';

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
