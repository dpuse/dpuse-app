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
