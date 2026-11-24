// ── External Dependencies & Registrations
import { describe, expect, it, vi } from 'vitest';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructContextDiagramTrail } from '@/features/studio/eventQueries/_contextDiagramFocus';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const MODEL_REFERENCE = { id: 'workforce', label: { en: 'Workforce' }, description: {} } as unknown as ContextConfig['areas'][number]['models'][number];
const AREA = { id: 'hr', label: { en: 'Human Resource' }, description: {}, models: [MODEL_REFERENCE] } as unknown as ContextConfig['areas'][number];
const CONTEXT = { id: 'default', label: { en: 'Context' }, description: {}, areas: [AREA] } as unknown as ContextConfig;
const ENTITY = { id: 'person', label: { en: 'Person' } } as unknown as ContextModelConfig['entities'][number];
const QUERY = { studio: '1' };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructContextDiagramTrail', () => {
    it('starts with the context, then the area, model and entity, each above the last leading back up to its level', () => {
        const trail = constructContextDiagramTrail(CONTEXT, { areaConfig: AREA, modelReferenceConfig: MODEL_REFERENCE, entityConfig: ENTITY }, 'en', QUERY, 'Level');

        expect(trail.items.map((item) => item.label)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person']);
        expect(trail.items.map((item) => item.to)).toStrictEqual([
            { name: 'eventQueryDiagram', params: { areaId: undefined, modelId: undefined, entityId: undefined }, query: QUERY },
            { name: 'eventQueryDiagram', params: { areaId: 'hr', modelId: undefined, entityId: undefined }, query: QUERY },
            { name: 'eventQueryDiagram', params: { areaId: 'hr', modelId: 'workforce', entityId: undefined }, query: QUERY },
            undefined
        ]);
        expect(trail.label).toBe('Level');
    });

    it('shows the context alone, as text, at the top', () => {
        const trail = constructContextDiagramTrail(CONTEXT, { areaConfig: undefined, modelReferenceConfig: undefined, entityConfig: undefined }, 'en', QUERY, 'Level');

        expect(trail.items).toStrictEqual([{ id: 'context', label: 'Context' }]);
    });
});
