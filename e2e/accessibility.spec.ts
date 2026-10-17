// ── External Dependencies & Registrations
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// The ESLint accessibility rules only see plain HTML elements in the template source. axe checks the page as the
// browser shows it, so it also covers custom components, values bound at runtime and colour contrast.
const SCREENS = [
    { id: 'studio', paneRegion: 'StudioPane', url: '/' },
    { id: 'dataViews', paneRegion: 'StudioPane', url: '/dataViews' },
    { id: 'eventQueries', paneRegion: 'StudioPane', url: '/eventQueries' },
    { id: 'presentations', paneRegion: 'StudioPane', url: '/presentations' },
    { id: 'dataApps', paneRegion: 'StudioPane', url: '/dataApps' },
    { id: 'setup', paneRegion: 'StudioPane', url: '/setup' },
    { id: 'assistant', paneRegion: 'AssistantPane', url: '/?assistant=1' }
];

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

test.describe('Accessibility', () => {
    // Without motion, so each screen is checked as it ends up. Mid-fade, its text is partly transparent and fails the
    // contrast check. The app's fades switch off for reduced motion.
    test.use({ contextOptions: { reducedMotion: 'reduce' } });

    for (const screen of SCREENS) {
        test(`${screen.id} has no axe violations`, async ({ page }) => {
            await page.goto(screen.url);
            await expect(page.locator(`[data-region="${screen.paneRegion}"] h1, [data-region="${screen.paneRegion}"] h2`).first()).toBeVisible(); // The pane's view has rendered, not just its frame.

            const results = await new AxeBuilder({ page }).analyze();

            const violations = results.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target.join(' ')) })); // axe's full report runs to hundreds of lines per screen.
            expect(violations).toEqual([]);
        });
    }
});
