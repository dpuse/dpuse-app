import { AppError } from '@dpuse/dpuse-shared/errors';
import ErrorBoundary from '@/components/ui/error/ErrorBoundary.vue';
import { createMemoryHistory, createRouter } from 'vue-router';
import { defineAsyncPanel } from '@/utilities/index.ts';
import { flushPromises, mount } from '@vue/test-utils';
import { reportAppError } from '@/observability/errorTracking';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAppFailures, isComponentLoaderErrorInfo, raiseAppFailure } from '@/state/errors';
import { defineComponent, h, nextTick } from 'vue';

vi.mock('@/observability/errorTracking', () => ({ reportAppError: vi.fn(() => Promise.resolve(true)) }));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Vue notifies every ancestor and the app handler about a lazy component's load failure *as well as* rendering that
// component's own 'errorComponent', so one failure reaches three places that each want to report it. These assert that
// only one of them does — a duplicate is not a cosmetic problem: it doubles the noise in Axiom and puts a generic
// message across the top of an app whose only actual loss is one panel.
async function settle(): Promise<void> {
    for (let index = 0; index < 6; index++) {
        await flushPromises();
        await nextTick();
    }
}

// Mirrors the handler 'main.ts' installs, guard included.
function appErrorHandler(error: unknown, _instance: unknown, info: string): void {
    if (isComponentLoaderErrorInfo(info)) return;
    raiseAppFailure(new AppError('Unhandled Vue error.', 'test', { info, typeId: 'unhandledVueRuntime' }, { cause: error }));
}

function buildPanel(name: string): ReturnType<typeof defineAsyncPanel> {
    return defineAsyncPanel(() => Promise.resolve(defineComponent({ template: '<div data-region="Panel" />' })), name);
}

function reportedMessages(): string[] {
    return vi.mocked(reportAppError).mock.calls.map((call) => call[0].message);
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('error reporting hierarchy', () => {
    beforeEach(() => {
        clearAppFailures();
        vi.mocked(reportAppError).mockClear();
    });

    it('recognises the info Vue sends for a lazy component load failure, in both its wordings', () => {
        expect(isComponentLoaderErrorInfo('async component loader')).toBe(true); // Development.
        expect(isComponentLoaderErrorInfo('https://vuejs.org/error-reference/#runtime-13')).toBe(true); // Production.
        expect(isComponentLoaderErrorInfo('render function')).toBe(false);
    });

    it('reports a panel load failure once, from the panel that lost something', async () => {
        history.replaceState({}, '', '/?fault=panel');
        const wrapper = mount(defineComponent({ render: () => h(buildPanel('BarePanel')) }), { global: { config: { errorHandler: appErrorHandler } } });
        await settle();

        expect(reportedMessages()).toStrictEqual(['Failed to load the BarePanel component.']);
        expect(wrapper.find('[data-region="ErrorDisplay"]').exists()).toBe(true);
    });

    it('leaves a panel load failure to the panel rather than replacing the whole region around it', async () => {
        history.replaceState({}, '', '/?fault=panel');
        const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] });
        await router.push('/');
        await router.isReady();

        const wrapper = mount(ErrorBoundary, {
            global: { plugins: [router], config: { errorHandler: appErrorHandler } },
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
        const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/', component: { template: '<div />' } }] });
        await router.push('/');
        await router.isReady();

        const child = defineComponent({
            setup() {
                throw new Error('Boom.');
            },
            template: '<div />'
        });
        mount(ErrorBoundary, { global: { plugins: [router], config: { errorHandler: appErrorHandler } }, props: { name: 'TestRegion' }, slots: { default: child } });
        await settle();

        expect(reportedMessages()).toStrictEqual(['Failed to render TestRegion.']);
    });

    it('reports a failed navigation once', async () => {
        history.replaceState({}, '', '/?fault=route');
        const { createAppRouter } = await import('@/router');
        const router = createAppRouter();
        mount(defineComponent({ template: '<RouterView />' }), { global: { plugins: [router], config: { errorHandler: appErrorHandler } } });
        // The navigation fails, which is the point; the router still reports it through 'onError'.
        try {
            await router.isReady();
        } catch {
            // Asserted through the reports below.
        }
        await settle();

        expect(reportedMessages()).toStrictEqual(['Navigation failed.']);
    });
});
