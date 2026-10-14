// ── External Dependencies & Registrations
import { expect, test } from '@playwright/test';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

test.describe('App', () => {
    test('opens on the studio home with no errors', async ({ page }) => {
        const errorMessages: string[] = [];
        page.on('console', (message) => {
            if (message.type() === 'error') errorMessages.push(message.text());
        });
        page.on('pageerror', (error) => {
            errorMessages.push(error.message);
        });

        await page.goto('/');

        await expect(page.locator('[data-region="StudioPane"]')).toBeVisible();
        await expect(page.getByRole('heading', { level: 1, name: 'Studio' })).toBeVisible();
        await expect(page.locator('[data-region="ErrorNotice"]')).toHaveCount(0);
        expect(errorMessages).toEqual([]);
    });
});
