// ── External Dependencies & Registrations
import { describe, expect, it } from 'vitest';

// ── DPUse Framework
import type { ContextConfig, ContextModelConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { constructEventQueryDiagramData, type EventQueryDiagramData, resolveEventQueryDiagramFocus } from '@/features/studio/eventQueries/_eventQueryDiagram';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const CONTEXT_CONFIG = {
    id: 'context',
    label: { en: 'Context', es: 'Contexto' },
    description: {},
    areas: [
        { id: 'fdn', label: { en: 'Foundation' }, description: {}, models: [{ id: 'general', label: { en: 'General' }, description: {} }] },
        {
            id: 'hr',
            label: { en: 'Human Resource' },
            description: {},
            icon: '<svg><path stroke="currentColor"/></svg>',
            models: [
                { id: 'workforce', label: { en: 'Workforce' }, description: {} },
                { id: 'learning', label: { en: 'Learning' }, description: {} }
            ]
        }
    ]
} as unknown as ContextConfig;

const WORKFORCE_MODEL_CONFIG = {
    entities: [
        {
            id: 'person',
            label: { en: 'Person' },
            events: [
                { id: 'activation', labelAction: { en: 'Birth' } },
                { id: 'deletion', labelAction: { en: 'Deletion' } }
            ]
        },
        { id: 'job', label: { en: 'Job' }, events: [] }
    ]
} as unknown as ContextModelConfig;

const LOOK = { add: 'Add event query', eventQueryIcon: '<svg data-id="eventQuery"/>', nodeColor: 'grey' };
const PERSON_FOCUS = { areaId: 'hr', modelId: 'workforce', entityId: 'person' };
const BIRTH_FOCUS = { ...PERSON_FOCUS, eventId: 'activation' };
const HIRES = { id: 'a', label: 'Hires', contextEventReference: BIRTH_FOCUS };
const LEAVERS = { id: 'b', label: 'Leavers', contextEventReference: { ...PERSON_FOCUS, eventId: 'deletion' } };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('constructEventQueryDiagramData', () => {
    it('shows the context with its areas, and none of their models, when nothing is focused', () => {
        const data = constructEventQueryDiagramData(CONTEXT_CONFIG, 'en', {}, { look: LOOK });

        expect(labels(data)).toStrictEqual(['Context', 'Foundation', 'Human Resource']);
        expect(data.links).toStrictEqual([
            { source: 'context', target: 'context.fdn' },
            { source: 'context', target: 'context.hr' }
        ]);
        expect(data.nodes.some((node) => node.isSelected === true)).toBe(false);
    });

    it('opens each level in turn, leaving out the siblings of the nodes on the path, and selects the deepest', () => {
        const area = constructEventQueryDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'hr' }, { look: LOOK });
        const model = constructEventQueryDiagramData(CONTEXT_CONFIG, 'en', { areaId: 'hr', modelId: 'workforce' }, { focusedModelConfig: WORKFORCE_MODEL_CONFIG, look: LOOK });
        const entity = constructEventQueryDiagramData(CONTEXT_CONFIG, 'en', PERSON_FOCUS, { focusedModelConfig: WORKFORCE_MODEL_CONFIG, look: LOOK });

        expect(labels(area)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Learning']);
        expect(selected(area)).toStrictEqual(['Human Resource']);
        expect(labels(model)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Job']);
        expect(selected(model)).toStrictEqual(['Workforce']);
        expect(labels(entity)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Birth', 'Deletion']);
        expect(selected(entity)).toStrictEqual(['Person']);
    });

    it('leaves out a model’s entities until its data has loaded', () => {
        const data = constructEventQueryDiagramData(CONTEXT_CONFIG, 'en', PERSON_FOCUS, { look: LOOK });

        expect(labels(data)).toStrictEqual(['Context', 'Human Resource', 'Workforce']);
    });

    it('opens an event to show its own event queries and a node that adds one for it', () => {
        const data = constructEventQueryDiagramData(CONTEXT_CONFIG, 'en', BIRTH_FOCUS, { eventQueries: [HIRES, LEAVERS], focusedModelConfig: WORKFORCE_MODEL_CONFIG, look: LOOK });

        expect(labels(data)).toStrictEqual(['Context', 'Human Resource', 'Workforce', 'Person', 'Birth', 'Hires', 'Add event query']);
        expect(data.nodes.find((node) => node.label === 'Hires')).toMatchObject({ typeId: 'eventQuery', eventQueryId: 'a', icon: LOOK.eventQueryIcon, isSelected: false });
        expect(data.nodes.at(-1)).toMatchObject({ typeId: 'add', isAction: true, symbol: '+', contextEventReference: BIRTH_FOCUS });
        expect(selected(data)).toStrictEqual(['Birth']);
    });

    it('selects an event query in place of its event, and only one shown under the focused event', () => {
        const options = { eventQueries: [HIRES, LEAVERS], focusedModelConfig: WORKFORCE_MODEL_CONFIG, look: LOOK };

        expect(selected(constructEventQueryDiagramData(CONTEXT_CONFIG, 'en', BIRTH_FOCUS, { ...options, selectedEventQueryId: 'a' }))).toStrictEqual(['Hires']);
        expect(selected(constructEventQueryDiagramData(CONTEXT_CONFIG, 'en', BIRTH_FOCUS, { ...options, selectedEventQueryId: 'b' }))).toStrictEqual(['Birth']);
    });

    it('gives every node a focus that opens its own level, and the context node the top', () => {
        const data = constructEventQueryDiagramData(CONTEXT_CONFIG, 'en', BIRTH_FOCUS, { focusedModelConfig: WORKFORCE_MODEL_CONFIG, look: LOOK });

        expect(data.nodes.slice(0, 5).map((node) => node.focus)).toStrictEqual([{}, { areaId: 'hr' }, { areaId: 'hr', modelId: 'workforce' }, PERSON_FOCUS, BIRTH_FOCUS]);
    });

    it('draws the context node as its icon on a disc, named by its tooltip, and colours every node below it', () => {
        const data = constructEventQueryDiagramData(
            CONTEXT_CONFIG,
            'en',
            { areaId: 'hr' },
            { look: { ...LOOK, areaIconColor: 'green', rootDiscColor: 'amber', rootIcon: '<svg/>' } }
        );

        expect(data.nodes[0]).toMatchObject({ title: 'Context', icon: '<svg/>', color: 'amber', discColor: 'amber' });
        expect(data.nodes[0]?.label).toBeUndefined();
        expect(data.nodes.slice(1).every((node) => node.color === 'grey')).toBe(true);
        expect(data.nodes[1]?.icon).toBe('<svg xmlns="http://www.w3.org/2000/svg"><path stroke="green"/></svg>');
    });
    it('draws an area’s dark icon in the dark appearance, where it has one', () => {
        const contextConfig = {
            ...CONTEXT_CONFIG,
            areas: [{ id: 'hr', label: { en: 'HR' }, description: {}, models: [], icon: '<svg xmlns="light"/>', iconDark: '<svg xmlns="dark"/>' }]
        } as unknown as ContextConfig;
        const readAreaIcon = (isDark: boolean): string | undefined => constructEventQueryDiagramData(contextConfig, 'en', {}, { look: { ...LOOK, isDark } }).nodes[1]?.icon;

        expect(readAreaIcon(false)).toBe('<svg xmlns="light"/>');
        expect(readAreaIcon(true)).toBe('<svg xmlns="dark"/>');
    });
});

describe('resolveEventQueryDiagramFocus', () => {
    it('opens at the selected event query’s event, whatever level the URL names', () => {
        expect(resolveEventQueryDiagramFocus({ areaId: 'fdn' }, HIRES)).toStrictEqual(BIRTH_FOCUS);
    });

    it('keeps the level the URL names when no event query is selected, or the selected one has no event', () => {
        expect(resolveEventQueryDiagramFocus({ areaId: 'fdn' })).toStrictEqual({ areaId: 'fdn' });
        expect(resolveEventQueryDiagramFocus({ areaId: 'fdn' }, { contextEventReference: undefined })).toStrictEqual({ areaId: 'fdn' });
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function labels(data: EventQueryDiagramData): string[] {
    return data.nodes.map((node) => node.label ?? node.title ?? '');
}

function selected(data: EventQueryDiagramData): string[] {
    return data.nodes.filter((node) => node.isSelected === true).map((node) => node.label ?? '');
}
