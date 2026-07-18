Object.defineProperties(globalThis, {
    matchMedia: {
        writable: true,
        value: (query: string): MediaQueryList => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: (): void => {},
            removeEventListener: (): void => {},
            addListener: (): void => {},
            removeListener: (): void => {},
            dispatchEvent: (): boolean => false
        })
    },
    scrollTo: {
        writable: true,
        value: () => {}
    }
});
