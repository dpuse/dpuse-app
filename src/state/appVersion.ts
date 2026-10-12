// ── External Dependencies & Registrations
import { computed, shallowRef } from 'vue';

// ── Local Framework
import { version } from '~/package.json';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Remembers which version a reload was made for, so a reload that still serves the old page cannot repeat forever.
const RELOADED_FOR_VERSION_KEY = 'dpuse-reloadedForVersion';

// ── State ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// The app version currently deployed, as announced by the configuration service. Undefined until it has said.
export const liveAppVersion = shallowRef<string | undefined>();

// True once any module the page uses (engine, connectors, presenters, tools, cookbooks) has changed since it loaded.
// Nothing is swapped in place, because a loaded module cannot be unloaded and two versions side by side would disagree.
// A reload is the only clean way to pick up the change, and the user decides when.
export const moduleUpdateIsAvailable = shallowRef(false);

// ── Derived State ────────────────────────────────────────────────────────────────────────────────────────────────────

// Newer, not just different: a development build is often ahead of the deployed version and must not count as stale.
export const newAppVersionIsAvailable = computed(() => liveAppVersion.value != null && isNewerVersion(liveAppVersion.value, version));

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// True when a newer version is deployed and no reload has been made for it yet. Only once per version: if the page
// served is still the old one, reloading again would only loop.
export function canReloadForNewAppVersion(): boolean {
    const targetVersion = liveAppVersion.value;
    if (targetVersion == null || !newAppVersionIsAvailable.value) return false;

    const reloadedForVersion = readReloadedForVersion();
    return reloadedForVersion !== undefined && reloadedForVersion !== targetVersion;
}

// Loads the path as a fresh page so the new version is fetched.
export function reloadForNewAppVersion(path: string): void {
    if (liveAppVersion.value != null) writeReloadedForVersion(liveAppVersion.value);
    location.assign(path);
}

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Numeric collation compares each run of digits as a number, so '1.0.129' is newer than '1.0.13'.
function isNewerVersion(candidate: string, current: string): boolean {
    return candidate.localeCompare(current, undefined, { numeric: true }) > 0;
}

// Null when no reload has been made yet. Undefined when storage is blocked, for example in some private windows: the
// guard cannot remember a reload then, so none is made.
function readReloadedForVersion(): string | null | undefined {
    try {
        return sessionStorage.getItem(RELOADED_FOR_VERSION_KEY);
    } catch {
        return undefined;
    }
}

function writeReloadedForVersion(targetVersion: string): void {
    try {
        sessionStorage.setItem(RELOADED_FOR_VERSION_KEY, targetVersion);
    } catch {
        // Unreachable in practice: a blocked read has already stopped the reload.
    }
}
