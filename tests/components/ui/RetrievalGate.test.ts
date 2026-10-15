// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

// ── Local Framework
import { buildFailedRetrievalStatus } from '~/tests/support/failures';
import RetrievalGate from '@/components/ui/RetrievalGate.vue';
import type { RetrievalStatus } from '@/state/configs';

vi.mock('@/observability/errorTracking', () => import('~/tests/support/errorTracking'));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function mountGate(status: RetrievalStatus): ReturnType<typeof mount> {
    return mount(RetrievalGate, { props: { status }, slots: { default: '<div data-region="TestContent">Loaded.</div>' } });
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('RetrievalGate', () => {
    it('shows a busy bar and no content while pending', () => {
        const wrapper = mountGate({ typeId: 'pending' });

        expect(wrapper.find('[data-region="BusyBar"]').exists()).toBe(true);
        expect(wrapper.find('[data-region="TestContent"]').exists()).toBe(false);
    });

    it('shows the failure, without Retry, and no content when retrieval failed', () => {
        const wrapper = mountGate(buildFailedRetrievalStatus());

        expect(wrapper.findComponent({ name: 'ErrorNotice' }).props('canRetry')).toBe(false);
        expect(wrapper.find('[data-region="TestContent"]').exists()).toBe(false);
    });

    it('shows the content once ready', () => {
        const wrapper = mountGate({ typeId: 'ready' });

        expect(wrapper.find('[data-region="TestContent"]').exists()).toBe(true);
        expect(wrapper.find('[data-region="BusyBar"]').exists()).toBe(false);
    });
});
