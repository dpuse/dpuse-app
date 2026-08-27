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

// jsdom implements '<dialog>' but not 'showModal'/'close', which is what the app uses to promote a dialog to the top
// layer. Modelled just closely enough for the open state to be observable.

HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
    this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
};
