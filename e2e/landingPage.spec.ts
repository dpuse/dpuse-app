/**
 * Playwright configuration.
 */

// External Dependencies.
import { expect, test } from '@playwright/test';

// Configure the Playwright Test timeout to 210 seconds,
// ensuring that longer tests conclude before Checkly's browser check timeout of 240 seconds.
// The default Playwright Test timeout is set at 30 seconds.
// For additional information on timeouts, visit: https://checklyhq.com/docs/browser-checks/timeouts/
test.setTimeout(210_000);

// Set the action timeout to 10 seconds to quickly identify failing actions.
// By default Playwright Test has no timeout for actions (e.g. clicking an element).
test.use({ actionTimeout: 10_000 });

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Need to understand how to handle process
// @ts-ignore
const url = process.env.PLAYWRIGHT_BASE_URL ?? '/';

/** Tests */
test.describe('Landing page', () => {
    test('renders header', async ({ page }) => {
        await page.goto(url);

        const heading = page.getByTestId('header');
        await expect(heading).toBeVisible();
        await expect(heading).toContainText('Workflow');

        // await expect(page.getByText('Making it easier to work with data.', { exact: false })).toBeVisible();

        // const libraryCta = page.getByRole('button', { name: /Explore the Library/i }).first();
        // await expect(libraryCta).toBeVisible();

        // const workbenchCta = page.getByRole('button', { name: /Open your Workbench/i }).first();
        // await expect(workbenchCta).toBeVisible();
    });
});
