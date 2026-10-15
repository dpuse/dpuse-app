/* eslint-disable vue/one-component-per-file -- Test files can define several small components to mount. */
// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

// ── Local Framework
import { buildMemoryRouter } from '~/tests/support/router';
import { defineLazyComponent } from '@/utilities/index.ts';
import ErrorBoundary from '@/components/ui/error/ErrorBoundary.vue';
import { hasReportedAppError } from '@/observability/errorTracking';
import { settle } from '~/tests/support/settle';
import { clearAppFailures, handleRaiseVueError } from '@/state/errors';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// A panel whose chunk cannot be fetched.
function buildPanel(name: string): ReturnType<typeof defineLazyComponent> {
    return defineLazyComponent(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module.')), name);
}

function reportedMessages(): string[] {
    return vi.mocked(hasReportedAppError).mock.calls.map((call) => call[0].message);
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Vue notifies every ancestor and the app handler about a lazy component's load failure *as well as* rendering that
// component's own 'errorComponent', so one failure reaches three places that each want to report it. These assert that
// only one of them does — a duplicate is not a cosmetic problem: it doubles the noise in Axiom and puts a generic
// message across the top of an app whose only actual loss is one panel.
describe('error reporting hierarchy', () => {
    beforeEach(() => {
        clearAppFailures();
        vi.mocked(hasReportedAppError).mockClear();
    });

    it('reports a panel load failure once, from the panel that lost something', async () => {
        const wrapper = mount(defineComponent({ render: () => h(buildPanel('BarePanel')) }), { global: { config: { errorHandler: handleRaiseVueError } } });
        await settle();

        expect(reportedMessages()).toStrictEqual(['Failed to load the BarePanel component.']);
        expect(wrapper.find('[data-region="ErrorNotice"]').exists()).toBe(true);
    });

    it('leaves a panel load failure to the panel rather than replacing the whole region around it', async () => {
        const router = await buildMemoryRouter();

        const wrapper = mount(ErrorBoundary, {
            global: { plugins: [router], config: { errorHandler: handleRaiseVueError } },
            props: { name: 'TestRegion' },
            slots: { default: () => h(buildPanel('BoundedPanel')) }
        });
        await settle();

        // The panel names itself; 'Failed to render TestRegion.' would mean the boundary had claimed it instead.
        expect(reportedMessages()).toStrictEqual(['Failed to load the BoundedPanel component.']);
        expect(wrapper.text()).toContain('Failed to load the BoundedPanel component.');
    });

    it('still reports a render failure the boundary is genuinely responsible for', async () => {
        history.replaceState({}, '', '/');
        const router = await buildMemoryRouter();

        const child = defineComponent({
            setup() {
                throw new Error('Boom.');
            },
            template: '<div />'
        });
        mount(ErrorBoundary, { global: { plugins: [router], config: { errorHandler: handleRaiseVueError } }, props: { name: 'TestRegion' }, slots: { default: child } });
        await settle();

        expect(reportedMessages()).toStrictEqual(['Failed to render TestRegion.']);
    });
});
