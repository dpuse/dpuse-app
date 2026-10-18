// ── Local Framework
import type { AppFailure } from '@/state/errors';

// ── Actions ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Fetches the document again, which is what picks up the new deployment's chunk names. 'assign' is used when a failure
// recorded where the user was heading, so the reload finishes that journey rather than fetching the page in place: a
// route that cannot fetch its chunk leaves the URL on the screen the user was leaving.
export function reloadForFailures(failures: AppFailure[]): void {
    const reloadPath = failures.find((failure) => failure.reloadPath != null)?.reloadPath; // Only a failed navigation sets one, and only one is ever on screen.
    if (reloadPath == null) {
        location.reload();
        return;
    }
    location.assign(reloadPath);
}

// Resolves once the dialog and its backdrop have finished fading out, or at once when nothing is animating: reduced
// motion, or a browser that cannot animate a dialog leaving the top layer. 'getAnimations' brings the styles up to date
// first, so a transition the close has only just started is included. Escape closes the dialog too, so 'close' is the
// one event both ways of dismissing it share.
export async function waitForCloseAnimation(dialogElement: HTMLDialogElement | null): Promise<void> {
    if (dialogElement == null || !('getAnimations' in dialogElement)) return; // jsdom, in the tests, has no animations.
    await Promise.allSettled(dialogElement.getAnimations({ subtree: true }).map((animation) => animation.finished));
}
