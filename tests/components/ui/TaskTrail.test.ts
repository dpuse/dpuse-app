// ── External Dependencies & Registrations
import { ref } from 'vue';
import { useElementSize } from '@vueuse/core';
import { CableIcon, FolderIcon } from '@lucide/vue';
import { describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import { buildMemoryRouter } from '~/tests/support/router';
import TaskTrail from '@/components/ui/TaskTrail.vue';
import type { TaskTrailContent } from '@/components/ui/taskTrail';

// ── Mocks ────────────────────────────────────────────────────────────────────────────────────────────────────────────

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));
// jsdom lays nothing out, so the trail's width and the width its names need in full are set by each test.
vi.mock('@vueuse/core', async (importOriginal) => ({
    ...(await importOriginal<object>()),
    useElementSize: vi.fn(() => ({ height: ref(0), stop: vi.fn(), width: ref(0) }))
}));

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('TaskTrail', () => {
    it('shows each crumb in order, with crumbs that go somewhere as links or buttons and the rest as text', async () => {
        const select = vi.fn();
        const wrapper = await mountTrail({
            items: [
                { id: 'context', label: 'Context', to: '/up' },
                { id: 'area', label: 'Human Resource', select },
                { id: 'model', label: 'Workforce' }
            ],
            label: 'Level'
        });

        expect(wrapper.text()).toBe('Context/Human Resource/Workforce');
        const actions = wrapper.findAll('a, button'); // A crumb with a route is a link, and one that runs code is a button.
        expect(actions.map((action) => action.text())).toStrictEqual(['Context', 'Human Resource']);

        await actions[1]?.trigger('click');
        expect(select).toHaveBeenCalledOnce();
    });

    it('shows an icon-only crumb as its icon, named by its tooltip', async () => {
        const wrapper = await mountTrail({ items: [{ id: 'connection', label: 'Work', icon: CableIcon, isLabelHidden: true }], label: 'Trail' });

        const crumb = wrapper.get('[title="Work"]');
        expect(crumb.attributes('aria-label')).toBe('Work');
        expect(crumb.text()).toBe('');
    });

    it('shows a crumb as its compact icon, named by its tooltip, while the trail is too narrow for every name', async () => {
        setWidths({ fullWidth: 500, navWidth: 200 });
        const wrapper = await mountTrail({
            items: [
                { id: 'folder', label: 'HR', compactIcon: FolderIcon },
                { id: 'item', label: 'people.csv' }
            ],
            label: 'Trail'
        });

        const crumb = wrapper.get('[title="HR"]');
        expect(crumb.attributes('aria-label')).toBe('HR');
        expect(crumb.text()).toBe('');
        expect(wrapper.find('[title="people.csv"]').exists()).toBe(false);
    });

    it('shows every name while the trail is wide enough for them', async () => {
        setWidths({ fullWidth: 200, navWidth: 500 });
        const wrapper = await mountTrail({
            items: [
                { id: 'folder', label: 'HR', compactIcon: FolderIcon },
                { id: 'item', label: 'people.csv' }
            ],
            label: 'Trail'
        });

        expect(wrapper.find('[title="HR"]').exists()).toBe(false);
        expect(wrapper.get('nav > span:not([aria-hidden])').text()).toBe('HR');
    });

    it('is named for screen readers while it has links, and hidden from them while it is only text', async () => {
        const linked = await mountTrail({ items: [{ id: 'context', label: 'Context', to: '/up' }], label: 'Level' });
        const textOnly = await mountTrail({ items: [{ id: 'context', label: 'Context' }], label: 'Level' });

        expect(linked.get('nav').attributes()).toMatchObject({ 'aria-label': 'Level' });
        expect(linked.get('nav').attributes('aria-hidden')).toBeUndefined();
        expect(textOnly.get('nav').attributes('aria-hidden')).toBe('true');
    });

    it('shows the empty text, pale, while there are no crumbs', async () => {
        const wrapper = await mountTrail({ emptyText: 'Select a data view', items: [], label: 'Trail' });

        expect(wrapper.get('.text-hint').text()).toBe('Select a data view');
        wrapper.unmount();
    });

    it('leaves out the empty text once there are crumbs', async () => {
        const wrapper = await mountTrail({ emptyText: 'Select a data view', items: [{ id: 'model', label: 'Workforce' }], label: 'Trail' });

        expect(wrapper.text()).toBe('Workforce');
        wrapper.unmount();
    });

    it('gives way to one button back, followed by the last crumb', async () => {
        const back = { label: 'Files', select: vi.fn() };
        const wrapper = await mountTrail({ back, items: [{ id: 'connection', label: 'Work' }, { id: 'item', label: 'people.csv' }], label: 'Trail' });

        expect(wrapper.text()).toBe('Files/people.csv');
        await wrapper.get('[aria-label="Back to Files"]').trigger('click');
        expect(back.select).toHaveBeenCalledOnce();
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The trail measures itself first, then the hidden copy with every name in full.
function setWidths({ fullWidth, navWidth }: { fullWidth: number; navWidth: number }): void {
    vi.mocked(useElementSize)
        .mockReturnValueOnce({ height: ref(0), stop: vi.fn(), width: ref(navWidth) })
        .mockReturnValueOnce({ height: ref(0), stop: vi.fn(), width: ref(fullWidth) });
}

async function mountTrail(content: TaskTrailContent): Promise<VueWrapper> {
    const router = await buildMemoryRouter();
    return mount(TaskTrail, { props: content, global: { plugins: [router] } });
}
