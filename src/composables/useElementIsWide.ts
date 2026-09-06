// ── External Dependencies & Registrations
import { onUnmounted, type Ref, ref, watch } from 'vue';

// ── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface ElementIsWide {
    // False until the element has been measured, so a layout that has not been sized yet starts narrow rather than
    // flickering from wide to narrow on the first frame.
    isWide: Ref<boolean>;
    width: Ref<number>;
}

// ── Composables ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Whether an element is at least 'thresholdPx' wide, kept current by a 'ResizeObserver'.
//
// This is the container-scoped counterpart to 'viewportIsWide' in '@/state/appLayout', and the two are not
// interchangeable: a pane nested inside another pane changes width when the splitter above it is dragged, which no
// media query ever reports because the viewport has not moved. Anything laying out inside such a pane has to measure
// the pane.
//
// A CSS '@container' query covers the same ground for styling alone. This exists for the decisions CSS cannot make —
// whether a splitter is mounted at all, and which pane is in front when there is only room for one.
export function useElementIsWide(elementReference: Readonly<Ref<HTMLElement | null>>, thresholdPx: number): ElementIsWide {
    const isWide = ref(false);
    const width = ref(0);

    let resizeObserver: ResizeObserver | undefined;

    // Watched rather than read in 'onMounted': the element can arrive later than the mount ('v-if' above it, an async
    // component resolving) and can be replaced, so the observer follows the ref rather than the lifecycle.
    watch(
        elementReference,
        (element) => {
            disconnect();
            if (!element) return;

            resizeObserver = new ResizeObserver(() => {
                measure(element);
            });
            resizeObserver.observe(element);
            measure(element);
        },
        { immediate: true }
    );

    onUnmounted(disconnect);

    function disconnect(): void {
        resizeObserver?.disconnect();
        resizeObserver = undefined;
    }

    function measure(element: HTMLElement): void {
        width.value = element.clientWidth;
        isWide.value = element.clientWidth >= thresholdPx;
    }

    return { isWide, width };
}
