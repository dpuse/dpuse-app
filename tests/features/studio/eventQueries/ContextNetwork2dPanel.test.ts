// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

// ── Local Framework
import ContextNetwork2dPanel from '@/features/studio/eventQueries/ContextNetwork2dPanel.vue';
import { establishTool } from '@/services/tools';
import type { RenderContextDiagram } from '@/features/studio/eventQueries/_contextDiagram';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// The d3 tool is downloaded at run time, so a stand-in records what the panel asks it to draw.
vi.mock('@/services/tools', () => ({ establishTool: vi.fn() }));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The shared panel stands in as nothing, because only the renderer this panel hands it is under test.
const ContextNetworkPanelStub = { props: ['hint', 'renderContextDiagram'], render: (): null => null };

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('context network 2D panel', () => {
    it('draws with the d3 tool, fitted to the pane, passes on clicks and lays the diagram out', async () => {
        const view = { destroy: vi.fn(), resize: vi.fn(), triggerAutoLayout: vi.fn() };
        const renderNetworkDiagram = vi.fn().mockResolvedValue(view);
        vi.mocked(establishTool).mockResolvedValue({ renderNetworkDiagram });
        const wrapper = mount(ContextNetwork2dPanel, { global: { stubs: { ContextNetworkPanel: ContextNetworkPanelStub } } });
        const renderContextDiagram = wrapper.getComponent(ContextNetworkPanelStub).props('renderContextDiagram') as RenderContextDiagram;
        const data = { links: [], nodes: [] };
        const renderTo = document.createElement('div');
        const onNodeClick = vi.fn();

        const drawnView = await renderContextDiagram(data, renderTo, onNodeClick);

        expect(establishTool).toHaveBeenCalledWith('d3-visualiser');
        expect(renderNetworkDiagram).toHaveBeenCalledWith(data, renderTo, expect.objectContaining({ fitsView: true, onNodeClick }));
        expect(view.triggerAutoLayout).toHaveBeenCalledOnce();
        expect(drawnView).toBe(view);
        wrapper.unmount();
    });
});
