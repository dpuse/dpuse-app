// ── Tools ────────────────────────────────────────────────────────────────────────────────────────────────────────────

export function executeGetLocalTime(): { time: string; timezone: string; date: string } {
    return {
        time: new Date().toLocaleTimeString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        date: new Date().toLocaleDateString()
    };
}
