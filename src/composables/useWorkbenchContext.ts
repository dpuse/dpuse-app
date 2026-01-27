export function useWorkbenchContext(): ClientContext {
    const context: ClientContext = {
        browser: undefined,
        browserVersion: undefined,
        os: undefined,
        osVersion: undefined,
        machine: undefined,
        mobile: undefined,
        networkEffectiveType: undefined,
        userAgent: undefined
    };

    populateContext(context);
    return context;
}

interface ClientContext {
    browser: string | undefined;
    browserVersion: string | undefined;
    os: string | undefined;
    osVersion: string | undefined;
    machine: string | undefined;
    mobile: boolean | undefined;
    networkEffectiveType: string | undefined;
    userAgent: string | undefined;
}

interface NetworkInformation extends EventTarget {
    readonly downlink: number;
    readonly effectiveType: 'slow-2g' | '2g' | '3g' | '4g';
    readonly rtt: number;
    readonly saveData: boolean;
    onchange: EventListener | null;
}

function populateContext(context: ClientContext): void {
    if (typeof navigator === 'undefined') return;

    const userAgent = navigator.userAgent || '';
    context.userAgent = userAgent;

    if (/Edg\//.test(userAgent)) {
        context.browser = 'Edge';
        context.browserVersion = match(userAgent, /Edg\/([\d.]+)/);
    } else if (/Chrome\//.test(userAgent)) {
        context.browser = 'Chrome';
        context.browserVersion = match(userAgent, /Chrome\/([\d.]+)/);
    } else if (/Safari\//.test(userAgent)) {
        context.browser = 'Safari';
        context.browserVersion = match(userAgent, /Version\/([\d.]+)/);
    } else if (/Firefox\//.test(userAgent)) {
        context.browser = 'Firefox';
        context.browserVersion = match(userAgent, /Firefox\/([\d.]+)/);
    }

    if (/Windows NT/.test(userAgent)) {
        context.os = 'Windows';
        context.osVersion = match(userAgent, /Windows NT ([\d.]+)/);
    } else if (/Mac OS X/.test(userAgent)) {
        context.os = 'macOS';
        context.osVersion = match(userAgent, /Mac OS X ([\d_]+)/)?.replaceAll('_', '.');
    } else if (/Android/.test(userAgent)) {
        context.os = 'Android';
        context.osVersion = match(userAgent, /Android ([\d.]+)/);
    } else if (/iPhone|iPad/.test(userAgent)) {
        context.os = 'iOS';
        context.osVersion = match(userAgent, /OS ([\d_]+)/)?.replaceAll('_', '.');
    }

    context.mobile = /Mobi|Android/i.test(userAgent);
    context.machine = inferMachine(userAgent);

    const navigatorWithConnection = navigator as Navigator & {
        connection?: NetworkInformation;
        mozConnection?: NetworkInformation;
        webkitConnection?: NetworkInformation;
    };
    console.log('navigatorWithConnection', navigatorWithConnection);

    const connection = navigatorWithConnection.connection ?? navigatorWithConnection.mozConnection ?? navigatorWithConnection.webkitConnection;
    if (connection && typeof connection.effectiveType === 'string') {
        context.networkEffectiveType = connection.effectiveType;
    }
}

function match(string_: string, regex: RegExp): string | undefined {
    return string_.match(regex)?.[1] || undefined;
}

function inferMachine(ua: string): string | undefined {
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Macintosh/.test(ua) && /ARM|Apple/.test(ua)) return 'Apple Silicon Mac';
    if (/Macintosh/.test(ua)) return 'Macintosh';
    if (/Windows NT/.test(ua)) return 'Windows PC';
    if (/Android/.test(ua)) return 'Android Device';
    if (/CrOS/.test(ua)) return 'Chromebook';
    return undefined;
}
