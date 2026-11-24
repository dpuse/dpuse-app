// ── External Dependencies & Registrations
import { CableIcon } from '@lucide/vue';
import { describe, expect, it, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Local Framework
import { buildMemoryRouter } from '~/tests/support/router';
import TaskTrail from '@/components/ui/TaskTrail.vue';
import type { TaskTrailContent } from '@/components/ui/taskTrail';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

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

    it('is named for screen readers while it has links, and hidden from them while it is only text', async () => {
        const linked = await mountTrail({ items: [{ id: 'context', label: 'Context', to: '/up' }], label: 'Level' });
        const textOnly = await mountTrail({ items: [{ id: 'context', label: 'Context' }], label: 'Level' });

        expect(linked.get('nav').attributes()).toMatchObject({ 'aria-label': 'Level' });
        expect(linked.get('nav').attributes('aria-hidden')).toBeUndefined();
        expect(textOnly.get('nav').attributes('aria-hidden')).toBe('true');
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

async function mountTrail(content: TaskTrailContent): Promise<VueWrapper> {
    const router = await buildMemoryRouter();
    return mount(TaskTrail, { props: content, global: { plugins: [router] } });
}
