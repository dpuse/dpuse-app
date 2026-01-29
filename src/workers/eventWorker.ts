self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};

    switch (type) {
        case 'session:init':
            // Placeholder: store session context or perform handshake with backend
            console.debug('[event-worker] session:init', payload);
            break;
        case 'event':
            // Placeholder: forward event payload to backend/PostHog/etc.
            console.debug('[event-worker] event', payload);
            break;
        default:
            console.debug('[event-worker] unknown message', event.data);
    }
});

export {};
