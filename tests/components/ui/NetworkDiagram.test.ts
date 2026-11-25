// ── External Dependencies & Registrations
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import { establishTool } from '@/services/tools';
import NetworkDiagram from '@/components/ui/NetworkDiagram.vue';
import { settle } from '~/tests/support/settle';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// The d3 tool is downloaded at run time, so a stand-in records what the diagram asks it to draw.
vi.mock('@/services/tools', () => ({ establishTool: vi.fn() }));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const TOP_DATA = {
    links: [{ source: 'top', target: 'a' }],
    nodes: [
        { id: 'top', label: 'Top', level: 0 },
        { id: 'a', label: 'A', level: 1 }
    ]
};
const NEXT_DATA = { links: [], nodes: [{ id: 'a', label: 'A', level: 1 }] };

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

const diagramView = { destroy: vi.fn(), fitView: vi.fn(), resize: vi.fn(), triggerAutoLayout: vi.fn(), update: vi.fn(), zoomBy: vi.fn() };
const renderNetworkDiagram = vi.fn();
const wrappers: VueWrapper[] = []; // Unmounted after each test, so no diagram from one test redraws in the next.

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('network diagram', () => {
    beforeEach(() => {
        renderNetworkDiagram.mockResolvedValue(diagramView);
        vi.mocked(establishTool).mockResolvedValue({ renderNetworkDiagram });
    });

    afterEach(() => {
        for (const wrapper of wrappers.splice(0)) wrapper.unmount();
        vi.clearAllMocks();
    });

    it('draws its data with the d3 tool, then lays it out', async () => {
        await mountDiagram(TOP_DATA);

        expect(establishTool).toHaveBeenCalledWith('d3-visualiser');
        expect(renderNetworkDiagram.mock.lastCall?.[0]).toBe(TOP_DATA);
        expect(renderNetworkDiagram.mock.lastCall?.[2]).toMatchObject({ fitsView: true, labelPlacementId: 'outside' });
        expect(diagramView.triggerAutoLayout).toHaveBeenCalledOnce();
    });

    it('draws the lines in the caller’s colour, or leaves the tool its own when given none', async () => {
        await mountDiagram(TOP_DATA);
        expect(renderNetworkDiagram.mock.lastCall?.[2]).not.toHaveProperty('linkColor');

        await mountDiagram(TOP_DATA, 'var(--line)');
        expect(renderNetworkDiagram.mock.lastCall?.[2]).toMatchObject({ linkColor: 'var(--line)' });
    });

    it('keeps a small diagram at full size at the top of the pane, puts labels below the nodes in a narrow one, and cuts long labels short', async () => {
        await mountDiagram(TOP_DATA);

        expect(renderNetworkDiagram.mock.lastCall?.[2]).toMatchObject({ compactWidth: 480, fitAlignmentId: 'top', maximumFitScale: 1, maximumLabelLength: 24 });
    });

    it('reports a click away from every node', async () => {
        const wrapper = await mountDiagram(TOP_DATA);

        (renderNetworkDiagram.mock.lastCall?.[2] as { onBackgroundClick: () => void }).onBackgroundClick();

        expect(wrapper.emitted('backgroundClick')).toStrictEqual([[]]);
    });

    it('zooms in, zooms out and fits the diagram from its buttons', async () => {
        const wrapper = await mountDiagram(TOP_DATA);
        const [zoomOutButton, zoomInButton, fitButton] = wrapper.findAll('[data-region="DiagramZoomControls"] button');

        await zoomInButton.trigger('click');
        expect(diagramView.zoomBy).toHaveBeenLastCalledWith(1.25);
        await zoomOutButton.trigger('click');
        expect(diagramView.zoomBy).toHaveBeenLastCalledWith(0.8);
        await fitButton.trigger('click');
        expect(diagramView.fitView).toHaveBeenCalledOnce();
    });

    it('shows no zoom buttons for a diagram that cannot zoom', async () => {
        renderNetworkDiagram.mockResolvedValue({ destroy: vi.fn(), resize: vi.fn(), triggerAutoLayout: vi.fn(), update: vi.fn() });
        const wrapper = await mountDiagram(TOP_DATA);

        expect(wrapper.find('[data-region="DiagramZoomControls"]').exists()).toBe(false);
    });

    it('draws nothing until it has data', async () => {
        const wrapper = await mountDiagram(undefined);

        expect(renderNetworkDiagram).not.toHaveBeenCalled();

        await wrapper.setProps({ data: TOP_DATA });
        await settle();

        expect(renderNetworkDiagram).toHaveBeenCalledOnce();
    });

    it('changes the drawn diagram in place when its data changes, without drawing it again', async () => {
        const wrapper = await mountDiagram(TOP_DATA);

        await wrapper.setProps({ data: NEXT_DATA });
        await settle();

        expect(diagramView.update).toHaveBeenCalledWith(NEXT_DATA);
        expect(renderNetworkDiagram).toHaveBeenCalledOnce();
    });

    it('passes on a click with the caller’s own node', async () => {
        const wrapper = await mountDiagram(TOP_DATA);
        const { onNodeClick } = renderNetworkDiagram.mock.lastCall?.[2] as { onNodeClick: (node: { id: string }) => void };

        onNodeClick({ id: 'a' });

        expect(wrapper.emitted('nodeClick')).toStrictEqual([[TOP_DATA.nodes[1]]]);
    });

    it('shows the failure when the tool cannot be loaded, and draws the diagram on retry', async () => {
        vi.mocked(establishTool).mockRejectedValueOnce(new Error('Chunk failed.'));
        const wrapper = await mountDiagram(TOP_DATA);

        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);

        wrapper.getComponent({ name: 'ErrorNotice' }).vm.$emit('retry');
        await settle();

        expect(renderNetworkDiagram).toHaveBeenCalledOnce();
        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(false);
    });

    it('removes the diagram when it is left', async () => {
        const wrapper = await mountDiagram(TOP_DATA);

        wrapper.unmount();

        expect(diagramView.destroy).toHaveBeenCalledOnce();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function mountDiagram(data: typeof TOP_DATA | undefined, linkColor?: string): Promise<VueWrapper> {
    const wrapper = mount(NetworkDiagram, { attachTo: document.body, props: { data, label: 'Diagram', linkColor } });
    wrappers.push(wrapper);
    await settle();
    return wrapper;
}
