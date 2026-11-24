// ── External Dependencies & Registrations
import { describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructContextDiagramRoute, constructContextDiagramTrail, readContextDiagramFocus } from '@/features/studio/eventQueries/_contextDiagramFocus';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MODEL_REFERENCE = { id: 'workforce', label: { en: 'Workforce' }, description: {} } as unknown as ContextConfig['areas'][number]['models'][number];
const AREA = { id: 'hr', label: { en: 'Human Resource' }, description: {}, models: [MODEL_REFERENCE] } as unknown as ContextConfig['areas'][number];
const CONTEXT = { id: 'default', label: { en: 'Context' }, description: {}, areas: [AREA] } as unknown as ContextConfig;
const EVENT = { id: 'creation', labelAction: { en: 'Hire' }, description: {} } as unknown as ContextModelConfig['entities'][number]['events'][number];
const ENTITY = { id: 'person', label: { en: 'Person' }, events: [EVENT] } as unknown as ContextModelConfig['entities'][number];
const QUERY = { studio: '1' };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructContextDiagramTrail', () => {
    it('starts with the context, then the area, model and entity, each above the last leading back up to its level', () => {
        const trail = constructContextDiagramTrail(CONTEXT, { areaConfig: AREA, modelReferenceConfig: MODEL_REFERENCE, entityConfig: ENTITY }, 'en', QUERY, 'Level');

        expect(trail.items.map((item) => item.label)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person']);
        expect(trail.items.map((item) => item.to)).toStrictEqual([
            constructContextDiagramRoute({}, QUERY),
            constructContextDiagramRoute({ areaId: 'hr' }, QUERY),
            constructContextDiagramRoute({ areaId: 'hr', modelId: 'workforce' }, QUERY),
            undefined
        ]);
        expect(trail.label).toBe('Level');
    });

    it('ends with the event, with the entity above it leading back up to its level', () => {
        const trail = constructContextDiagramTrail(
            CONTEXT,
            { areaConfig: AREA, modelReferenceConfig: MODEL_REFERENCE, entityConfig: ENTITY, eventConfig: EVENT },
            'en',
            QUERY,
            'Level'
        );

        expect(trail.items.map((item) => item.label)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Hire']);
        expect(trail.items.at(-2)?.to).toStrictEqual(constructContextDiagramRoute({ areaId: 'hr', modelId: 'workforce', entityId: 'person' }, QUERY));
        expect(trail.items.at(-1)?.to).toBeUndefined();
    });

    it('shows the context alone, as text, at the top', () => {
        const trail = constructContextDiagramTrail(CONTEXT, { areaConfig: undefined, modelReferenceConfig: undefined, entityConfig: undefined }, 'en', QUERY, 'Level');

        expect(trail.items).toStrictEqual([{ id: 'context', label: 'Context' }]);
    });
});

describe('readContextDiagramFocus', () => {
    it('reads each level the route names, and an empty part as no level', () => {
        expect(readContextDiagramFocus({ areaId: 'hr', modelId: 'workforce', entityId: '', eventId: undefined })).toStrictEqual({
            areaId: 'hr',
            modelId: 'workforce',
            entityId: undefined,
            eventId: undefined
        });
    });
});

describe('constructContextDiagramRoute', () => {
    it('names the level and the event query selected under its event', () => {
        const focus = { areaId: 'hr', modelId: 'workforce', entityId: 'person', eventId: 'creation' };

        expect(constructContextDiagramRoute(focus, QUERY, 'a')).toStrictEqual({ name: 'eventQueryDiagram', params: { ...focus, eventQueryId: 'a' }, query: QUERY });
    });
});
