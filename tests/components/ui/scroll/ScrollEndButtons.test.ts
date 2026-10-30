// ── External Dependencies & Registrations
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// ── Local Framework
import ScrollEndButtons from '@/components/ui/scroll/ScrollEndButtons.vue';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const scrollTo = vi.fn();

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function buildScrollElement(scrollTop: number, scrollHeight: number): HTMLElement {
    const element = document.createElement('div');
    Object.defineProperties(element, {
        clientHeight: { value: 400 },
        scrollHeight: { value: scrollHeight },
        scrollTop: { value: scrollTop, writable: true }
    });
    element.scrollTo = scrollTo;
    return element;
}

async function mountButtons(scrollElement: HTMLElement): Promise<ReturnType<typeof mount>> {
    const wrapper = mount(ScrollEndButtons, { props: { scrollElement: undefined } });
    await wrapper.setProps({ scrollElement });
    scrollElement.dispatchEvent(new Event('scroll'));
    await nextTick();
    return wrapper;
}

function isButtonShown(wrapper: ReturnType<typeof mount>, label: string): boolean {
    return !wrapper.get(`button[aria-label="${label}"]`).classes().includes('invisible');
}

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

describe('ScrollEndButtons', () => {
    beforeAll(() => {
        vi.stubGlobal(
            'ResizeObserver',
            class {
                disconnect = vi.fn();
                observe = vi.fn();
            }
        );
    });

    it('shows only the bottom button at the top', async () => {
        const wrapper = await mountButtons(buildScrollElement(0, 1000));

        expect(isButtonShown(wrapper, 'Scroll to top')).toBe(false);
        expect(isButtonShown(wrapper, 'Scroll to bottom')).toBe(true);
    });

    it('shows both buttons part way down', async () => {
        const wrapper = await mountButtons(buildScrollElement(300, 1000));

        expect(isButtonShown(wrapper, 'Scroll to top')).toBe(true);
        expect(isButtonShown(wrapper, 'Scroll to bottom')).toBe(true);
    });

    it('shows only the top button at the bottom', async () => {
        const wrapper = await mountButtons(buildScrollElement(600, 1000));

        expect(isButtonShown(wrapper, 'Scroll to top')).toBe(true);
        expect(isButtonShown(wrapper, 'Scroll to bottom')).toBe(false);
    });

    it('shows neither button when the content fits', async () => {
        const wrapper = await mountButtons(buildScrollElement(0, 400));

        expect(isButtonShown(wrapper, 'Scroll to top')).toBe(false);
        expect(isButtonShown(wrapper, 'Scroll to bottom')).toBe(false);
    });

    it('scrolls to each end when its button is clicked', async () => {
        const scrollElement = buildScrollElement(300, 1000);
        const wrapper = await mountButtons(scrollElement);

        await wrapper.get('button[aria-label="Scroll to bottom"]').trigger('click');
        expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 1000 }));

        await wrapper.get('button[aria-label="Scroll to top"]').trigger('click');
        expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ top: 0 }));
    });
});
