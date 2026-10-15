// ── External Dependencies & Registrations
import { expect, test } from '@playwright/test';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

const OLD_CHROME_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.0.0 Safari/537.36';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

test.describe('Startup', () => {
    // An old browser fails the version check and lacks Trusted Types, which 'main.ts' accepts in place of a passing
    // version.
    test.describe('in an unsupported browser', () => {
        test.use({ userAgent: OLD_CHROME_USER_AGENT });

        test('shows the unsupported browser message instead of the app', async ({ page }) => {
            await page.addInitScript(() => {
                Reflect.deleteProperty(globalThis, 'trustedTypes');
                Reflect.deleteProperty(Window.prototype, 'trustedTypes');
            });

            await page.goto('/');

            await expect(page.getByRole('alert')).toContainText('This browser is too old to run DPUse.');
            await expect(page.locator('[data-region="App"]')).toHaveCount(0);
        });
    });

    // A page script that creates the 'default' policy first makes the app's own 'createPolicy' throw, which is a real
    // failure inside the startup 'try'.
    test('shows the plain failure message when the app fails to start', async ({ page }) => {
        await page.addInitScript(() => {
            trustedTypes?.createPolicy('default', {});
        });

        await page.goto('/');

        await expect(page.getByRole('alert')).toContainText('DPUse failed to load:');
        await expect(page.getByRole('button', { name: 'Reload the page' })).toBeVisible();
        await expect(page.locator('[data-region="App"]')).toHaveCount(0);
    });

    // Vite raises 'vite:preloadError' when a chunk it preloads cannot be fetched, usually because a new deployment
    // deleted it. The test raises the event itself, because Vite preloads only in the production build and at moments
    // a test cannot control.
    test('reports a failed chunk preload without showing anything', async ({ page }) => {
        const reportBodies: string[] = [];
        await page.route('**/events', async (route) => {
            reportBodies.push(route.request().postData() ?? '');
            await route.fulfill({ status: 200 }); // Keeps the test's error out of the real error log.
        });
        await page.goto('/');
        await expect(page.locator('[data-region="StudioPane"]')).toBeVisible();

        await page.evaluate(() => {
            const event = Object.assign(new Event('vite:preloadError'), { payload: new TypeError('Failed to fetch dynamically imported module.') });
            dispatchEvent(event);
        });

        await expect.poll(() => reportBodies.some((body) => body.includes('vitePreloadError'))).toBe(true);
        await expect(page.locator('[data-region="ErrorNotice"]')).toHaveCount(0);
    });

    test("allows only blob script URLs through the 'default' Trusted Types policy", async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('[data-region="StudioPane"]')).toBeVisible();

        const results = await page.evaluate(() => {
            const policy = trustedTypes?.defaultPolicy;
            function isScriptUrlAllowed(url: string): boolean {
                try {
                    policy?.createScriptURL(url);
                    return true;
                } catch {
                    return false;
                }
            }
            return { hasPolicy: policy != null, isBlobUrlAllowed: isScriptUrlAllowed('blob:https://localhost/worker'), isOtherUrlAllowed: isScriptUrlAllowed('https://example.com/script.js') };
        });
        expect(results).toStrictEqual({ hasPolicy: true, isBlobUrlAllowed: true, isOtherUrlAllowed: false });
    });
});
