// ── External Dependencies & Registrations
import { describe, expect, it, vi } from 'vitest';
import { ListIcon, NetworkIcon } from '@lucide/vue';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── DPUse Framework
import type { LocalisedConfig } from '@dpuse/dpuse-shared';

// ── Local Framework
import { buildMemoryRouter } from '~/tests/support/router';
import TaskLayout from '@/features/studio/_components/TaskLayout.vue';
import type { TaskLayoutView } from '@/features/studio/_components/TaskLayout.vue';
import type { TaskTrailContent } from '@/components/ui/taskTrail';
import type { TaskBarItem, TaskConfig } from '@/components/ui/taskBar';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const VIEW_ITEMS = [
    { id: 'diagram', label: 'Diagram', to: '/diagram' },
    { id: 'list', label: 'List', to: '/list' }
];
const TASK_ITEMS: TaskBarItem[] = [buildTask('connection', 1, false), buildTask('item', 2, true)];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('TaskLayout', () => {
    it('shows the views, then the tasks, in one row, marking the one on screen', async () => {
        const wrapper = await mountLayout({ currentTaskId: 'connection', taskItems: TASK_ITEMS });

        const viewLinks = wrapper.get('[data-region="TabBar"]').findAll('a');
        expect(viewLinks.map((link) => link.text())).toStrictEqual(['Diagram', 'List']);
        expect(viewLinks.map((link) => link.attributes('aria-current'))).toStrictEqual([undefined, undefined]);
        expect(wrapper.get('[data-region="TaskBar"] [aria-current="step"]').text()).toContain('Select Connection');
    });

    it('marks a locked task as disabled, so it is not read as one that can be opened', async () => {
        const wrapper = await mountLayout({ currentTaskId: 'connection', taskItems: TASK_ITEMS });

        const steps = wrapper.get('[data-region="TaskBar"]').findAll('li > *');
        expect(steps.map((step) => step.attributes('aria-disabled'))).toStrictEqual([undefined, 'true']);
    });

    it('marks the view on screen, and shows no tasks where there are none', async () => {
        const wrapper = await mountLayout({ currentViewId: 'list' });

        expect(wrapper.get('[data-region="TabBar"] [aria-current="page"]').text()).toBe('List');
        expect(wrapper.find('[data-region="TaskBar"]').exists()).toBe(false);
    });

    it('shows views with icons as icon links, named by their labels, marking the one on screen', async () => {
        const viewItems = [
            { id: 'list', icon: ListIcon, label: 'List', to: '/list' },
            { id: 'diagram', icon: NetworkIcon, label: 'Diagram', to: '/diagram' }
        ];
        const wrapper = await mountLayout({ currentViewId: 'diagram', viewItems });

        const viewLinks = wrapper.get('[data-region="TaskLayoutViews"]').findAll('a');
        expect(viewLinks.map((link) => [link.attributes('aria-label'), link.attributes('aria-current')])).toStrictEqual([
            ['List', undefined],
            ['Diagram', 'page']
        ]);
        expect(wrapper.find('[data-region="TabBar"]').exists()).toBe(false);
    });

    it('shows the trail it is given', async () => {
        const wrapper = await mountLayout({ trail: { items: [{ id: 'connection', label: 'Work' }], label: 'Trail' } });

        expect(wrapper.get('[data-region="TaskTrail"]').text()).toBe('Work');
    });

    it('keeps the space of the tasks and the trail while what they name loads, but not of the views', async () => {
        const wrapper = await mountLayout({ taskItems: TASK_ITEMS, tasksArePending: true, trail: { items: [{ id: 'connection', label: 'Work' }], label: 'Trail' } });

        expect(wrapper.get('[data-region="TaskBar"]').classes()).toContain('invisible');
        expect(wrapper.get('[data-region="TaskTrail"]').element.closest('.invisible')).not.toBeNull();
        expect(wrapper.get('[data-region="TabBar"]').classes()).not.toContain('invisible');
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

async function mountLayout(properties: {
    currentTaskId?: string;
    currentViewId?: string;
    taskItems?: TaskBarItem[];
    tasksArePending?: boolean;
    trail?: TaskTrailContent;
    viewItems?: TaskLayoutView[];
}): Promise<VueWrapper> {
    const router = await buildMemoryRouter();
    return mount(TaskLayout, {
        props: { overline: 'Studio', title: 'Establish Data Views', trail: { items: [], label: 'Trail' }, viewItems: VIEW_ITEMS, viewsLabel: 'Ways to view data views', ...properties },
        slots: { default: '<div />' },
        global: { plugins: [router] }
    });
}

function buildTask(id: string, number: number, isDisabled: boolean): TaskBarItem {
    const label = id === 'connection' ? 'Select Connection' : 'Select Item';
    const config = { id, label, labelLine1: { en: 'Select' }, labelLine2: { en: label }, description: '', enableUpTo: number, number } as unknown as LocalisedConfig<TaskConfig>;
    return { ...config, disabled: isDisabled };
}
