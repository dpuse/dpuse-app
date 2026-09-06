import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, type Ref, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { useElementIsWide } from '@/composables/useElementIsWide';

// A pane nested inside another pane changes width when the splitter above it moves, and no media query ever reports
// that — which is the whole reason this exists rather than another 'matchMedia' ref. The tests drive resizes directly.

interface FakeObserver {
    fire: () => void;
    disconnected: boolean;
    observed: Element[];
}

const observers: FakeObserver[] = [];

function buildElement(width: number): HTMLElement {
    const element = document.createElement('div');
    // jsdom reports 0 for every measurement, so the one property under test is defined by hand.
    Object.defineProperty(element, 'clientWidth', { configurable: true, value: width });
    return element;
}

function resizeElement(element: HTMLElement, width: number): void {
    Object.defineProperty(element, 'clientWidth', { configurable: true, value: width });
    for (const observer of observers) observer.fire();
}

function mountHarness(elementReference: Ref<HTMLElement | null>, thresholdPx: number) {
    const result: { isWide?: boolean; width?: number } = {};
    const wrapper = mount(
        defineComponent({
            setup() {
                const { isWide, width } = useElementIsWide(elementReference, thresholdPx);
                return () => {
                    result.isWide = isWide.value;
                    result.width = width.value;
                    return null;
                };
            }
        })
    );
    return { result, wrapper };
}

beforeEach(() => {
    observers.length = 0;
    // The suite-wide stub in 'setup.ts' never calls its callback, which is exactly what these tests need it to do.
    vi.stubGlobal(
        'ResizeObserver',
        class {
            private readonly record: FakeObserver;
            constructor(callback: () => void) {
                this.record = { fire: callback, disconnected: false, observed: [] };
                observers.push(this.record);
            }
            observe(element: Element): void {
                this.record.observed.push(element);
            }
            unobserve(): void {
                // Not used by the composable.
            }
            disconnect(): void {
                this.record.disconnected = true;
            }
            takeRecords(): [] {
                return [];
            }
        }
    );
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('element is wide', () => {
    it('measures as soon as the element arrives, without waiting for a resize', () => {
        const elementReference: Ref<HTMLElement | null> = ref(buildElement(800));
        const { result } = mountHarness(elementReference, 640);

        expect(result.isWide).toBe(true);
        expect(result.width).toBe(800);
    });

    it('starts narrow while there is nothing to measure, rather than assuming wide', () => {
        const elementReference: Ref<HTMLElement | null> = ref(null);
        const { result } = mountHarness(elementReference, 640);

        expect(result.isWide).toBe(false);
    });

    it('follows the element across a resize in both directions', async () => {
        const element = buildElement(800);
        const elementReference: Ref<HTMLElement | null> = ref(element);
        const { result } = mountHarness(elementReference, 640);

        resizeElement(element, 400);
        await nextTick();
        expect(result.isWide).toBe(false);

        resizeElement(element, 700);
        await nextTick();
        expect(result.isWide).toBe(true);
    });

    it('treats the threshold itself as wide', () => {
        const elementReference: Ref<HTMLElement | null> = ref(buildElement(640));
        const { result } = mountHarness(elementReference, 640);

        expect(result.isWide).toBe(true);
    });

    it('follows a replaced element, since the pane can be remounted beneath it', async () => {
        const elementReference: Ref<HTMLElement | null> = ref(buildElement(800));
        const { result } = mountHarness(elementReference, 640);
        expect(result.isWide).toBe(true);

        elementReference.value = buildElement(300);
        await nextTick();

        expect(result.isWide).toBe(false);
        expect(observers[0].disconnected).toBe(true); // The old element is no longer watched.
    });

    it('stops observing once the host unmounts', () => {
        const elementReference: Ref<HTMLElement | null> = ref(buildElement(800));
        const { wrapper } = mountHarness(elementReference, 640);

        wrapper.unmount();

        expect(observers.every((observer) => observer.disconnected)).toBe(true);
    });
});
