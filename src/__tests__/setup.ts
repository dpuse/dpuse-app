Object.defineProperties(globalThis, {
    matchMedia: {
        writable: true,
        value: (query: string): MediaQueryList => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: (): void => {
                // TODO
            },
            removeEventListener: (): void => {
                // TODO
            },
            addListener: (): void => {
                // TODO
            },
            removeListener: (): void => {
                // TODO
            },
            dispatchEvent: (): boolean => false
        })
    },
    scrollTo: {
        writable: true,
        value: () => {
            // TODO
        }
    }
});

// jsdom implements neither observer. Components that measure themselves construct one on mount, so without these the
// mount throws and the failure surfaces as something unrelated further up — a navigation error, or a component that
// looks like it failed to render. No callback ever fires: nothing under test depends on a resize or an intersection,
// only on the constructor existing.
class ObserverStub {
    observe(): void {
        // Nothing under test waits on a callback.
    }
    unobserve(): void {
        // As above.
    }
    disconnect(): void {
        // As above.
    }
    takeRecords(): [] {
        return [];
    }
}

// 'configurable' so a spec can put its own in place with 'vi.stubGlobal', which redefines rather than assigns. The stub
// here never calls back, which is what most specs want and what a spec testing observer-driven code cannot use.
Object.defineProperties(globalThis, {
    ResizeObserver: { configurable: true, writable: true, value: ObserverStub },
    IntersectionObserver: { configurable: true, writable: true, value: ObserverStub }
});

// jsdom has no 'document.fonts'. Components that measure text wait on 'document.fonts.ready' as they mount, so a font
// set that is already loaded stands in for it.
Object.defineProperty(document, 'fonts', { configurable: true, value: { ready: Promise.resolve() } });

// jsdom implements '<dialog>' but not 'showModal'/'close', which is what the app uses to promote a dialog to the top
// layer. Modelled just closely enough for the open state to be observable.

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
};
