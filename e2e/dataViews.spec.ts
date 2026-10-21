// ── External Dependencies & Registrations
import { expect, test } from '@playwright/test';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Each test starts in a fresh browser context, so the guest store is empty and the data view added here is the only one.
test.describe('Data views', () => {
    test('adds a data view once its connection is chosen, then deletes it', async ({ page }) => {
        await page.goto('/dataViews');
        await page.locator('[data-region="PillButton"]').getByText('Data View', { exact: true }).click(); // The empty list's own 'Data View' button shares the name.

        // Nothing is saved until a connection is committed.
        await expect(page).toHaveURL(/\/dataViews\/new\/connections/);
        await expect(page.getByRole('heading', { level: 1, name: 'New Data View' })).toBeVisible();

        await page.getByRole('button', { name: 'Application Emulator', exact: true }).click();
        await page.getByRole('button', { name: 'Select', exact: true }).click();

        await expect(page).toHaveURL(/\/dataViews\/(?!new\/)[^/]+\/items/);
        const dataViewId = /\/dataViews\/([^/]+)\/items/.exec(page.url())?.[1];
        expect(dataViewId).toBeDefined();

        await page.goto(`/dataViews/${dataViewId ?? ''}`);
        await page.getByRole('button', { name: 'Delete Data View' }).click();
        await page.getByRole('alertdialog', { name: 'Delete Data View' }).getByRole('button', { name: 'Delete', exact: true }).click();

        await expect(page).toHaveURL(/\/dataViews(\?|$)/);
        await expect(page.locator('[data-region="ConfigCard"]')).toHaveCount(0);
        await expect(page.getByText('“Untitled Data View” deleted.')).toBeFocused();
    });
});
