// ── External Dependencies & Registrations
import { expect, type Locator, type Page, test } from '@playwright/test';

// ── Tests ────────────────────────────────────────────────────────────────────────────────────────────────────────────

// Each test starts in a fresh browser context, so the guest store is empty and the data view added here is the only one.
test.describe('Data views', () => {
    test('adds a data view once its connection is chosen, then deletes it', async ({ page }) => {
        // TODO: The page sometimes never loads, so the test fails at random. Firefox gets a module from the Vite dev
        // server cut short (NS_ERROR_NET_PARTIAL_TRANSFER, https://github.com/vitejs/vite/issues/7059). WebKit opens the
        // configuration WebSocket but never receives the first module list from 'api.dpuse.app'. Remove the skip once
        // both are fixed.
        // eslint-disable-next-line playwright/no-skipped-test -- Skipped on purpose until the page loads reliably.
        test.skip(true, 'Suspended: the page fails to load at random (Vite module downloads cut short in Firefox, configuration WebSocket silent in WebKit).');

        await page.goto('/dataViews/list'); // The list, which has the 'Data View' pill.
        await page.locator('[data-region="PillButton"]').getByText('Data View', { exact: true }).click(); // The empty list's own 'Data View' button shares the name.

        // Nothing is saved until a connection is committed.
        await expect(page).toHaveURL(/\/dataViews\/new\/connections/);
        await expect(page.getByRole('heading', { level: 1, name: 'New Data View' })).toBeVisible();

        await page.getByRole('button', { name: 'DPUse Application Emulator', exact: true }).click();
        await page.getByRole('button', { name: 'Select', exact: true }).click();

        await expect(page).toHaveURL(/\/dataViews\/(?!new\/)[^/]+\/items/);
        const dataViewId = /\/dataViews\/([^/]+)\/items/.exec(page.url())?.[1];
        expect(dataViewId).toBeDefined();

        await page.goto(`/dataViews/list/${dataViewId ?? ''}`);
        await page.getByRole('button', { name: 'Delete Data View' }).click();
        await page.getByRole('alertdialog', { name: 'Delete Data View' }).getByRole('button', { name: 'Delete', exact: true }).click();

        await expect(page).toHaveURL(/\/dataViews\/list(\?|$)/);
        await expect(page.locator('[data-region="ConfigCard"]')).toHaveCount(0);
        await expect(page.getByText('“Untitled Data View” deleted.')).toBeFocused();
    });

    test('stores nothing until Save, and asks before leaving unsaved changes', async ({ browserName, page }) => {
        // eslint-disable-next-line playwright/no-skipped-test -- Firefox and WebKit fail to load the page at random, as the test above says.
        test.skip(browserName !== 'chromium', 'Firefox and WebKit fail to load the page at random.');

        await page.goto('/dataViews/list'); // The list, which has the 'Data View' pill.
        await page.locator('[data-region="PillButton"]').getByText('Data View', { exact: true }).click();
        await expect(page).toHaveURL(/\/dataViews\/new\/connections/);
        const pill = page.locator('[data-region="DataViewPill"]');
        await expect(pill.getByRole('button', { name: 'Discard' })).toBeDisabled();

        await page.getByRole('button', { name: 'DPUse Application Emulator', exact: true }).click();
        await expect(pill.getByRole('button', { name: 'Discard' })).toBeEnabled();
        await expect(pill.getByRole('button', { name: 'Save' })).toBeDisabled(); // A connection alone is not a whole data view.

        await page.locator('[data-region="TaskLayoutViews"]').getByRole('link', { name: 'List' }).click(); // A task leaves through a view beside the tasks.
        const question = page.getByRole('alertdialog', { name: 'Discard Changes?' });
        await question.getByRole('button', { name: 'Stay' }).click();
        await expect(page).toHaveURL(/\/dataViews\/new\/connections/);

        await page.locator('[data-region="TaskLayoutViews"]').getByRole('link', { name: 'List' }).click(); // A task leaves through a view beside the tasks.
        await question.getByRole('button', { name: 'Discard' }).click();
        await expect(page).toHaveURL(/\/dataViews\/list(\?|$)/);
        await expect(page.locator('[data-region="ConfigCard"]')).toHaveCount(0);
    });

    test('opens a data view selected in the list at any task it has reached', async ({ browserName, page }) => {
        // eslint-disable-next-line playwright/no-skipped-test -- Firefox and WebKit fail to load the page at random, as the first test says.
        test.skip(browserName !== 'chromium', 'Firefox and WebKit fail to load the page at random.');

        await page.goto('/dataViews/list');
        await page.locator('[data-region="PillButton"]').getByText('Data View', { exact: true }).click();
        await page.getByRole('button', { name: 'DPUse Application Emulator', exact: true }).click();
        await page.getByRole('button', { name: 'Select', exact: true }).click();
        await page.getByRole('button', { name: 'Table: People' }).click();
        await page.locator('[data-region="DataViewPill"]').getByRole('button', { name: 'Save' }).click();
        await expect(page).toHaveURL(/\/dataViews\/(?!new\/)[^/]+\/items/); // Saved, so it has its own id.
        const dataViewId = /\/dataViews\/([^/]+)\/items/.exec(page.url())?.[1] ?? '';

        await page.goto(`/dataViews/list/${dataViewId}`);
        const taskLinks = page.locator('[data-region="TaskBar"] a');
        await expect(taskLinks).toHaveCount(2); // Its connection and item. Explore Data waits for the records, which are not loaded.

        // The trail shows the same connection and item on the list, the diagram and the item task.
        const trail = page.locator('[data-region="TaskTrail"]');
        await expect(trail.getByText('People')).toBeVisible();
        await expect(trail.getByLabel('DPUse Application Emulator')).toBeVisible();
        const listTrailText = (await trail.textContent()) ?? '';
        await page.getByRole('link', { name: 'Diagram' }).click();
        await expect(page).toHaveURL(new RegExp(`/dataViews/diagram/[^/]+/[^/]+/${dataViewId}`));
        await expect(trail).toHaveText(listTrailText);
        await taskLinks.nth(1).click();
        await expect(page).toHaveURL(new RegExp(`/dataViews/${dataViewId}/items`));
        await expect(trail).toHaveText(listTrailText);

        await taskLinks.first().click();
        await expect(page).toHaveURL(new RegExp(`/dataViews/${dataViewId}/connections`));
    });

    test('opens a data view in the diagram when its node is double-clicked', async ({ browserName, page }) => {
        // eslint-disable-next-line playwright/no-skipped-test -- Firefox and WebKit fail to load the page at random, as the first test says.
        test.skip(browserName !== 'chromium', 'Firefox and WebKit fail to load the page at random.');

        await page.goto('/dataViews/list');
        await page.locator('[data-region="PillButton"]').getByText('Data View', { exact: true }).click();
        await page.getByRole('button', { name: 'DPUse Application Emulator', exact: true }).click();
        await page.getByRole('button', { name: 'Select', exact: true }).click();
        await page.getByRole('button', { name: 'Table: People' }).click();
        await page.locator('[data-region="DataViewPill"]').getByRole('button', { name: 'Save' }).click();
        await expect(page).toHaveURL(/\/dataViews\/(?!new\/)[^/]+\/items/);
        const dataViewId = /\/dataViews\/([^/]+)\/items/.exec(page.url())?.[1] ?? '';

        // Selected in the list, so the diagram opens at its connection. A click away from every node clears the
        // selection, a click on the node selects it again, and a double-click opens it.
        await page.goto(`/dataViews/list/${dataViewId}`);
        await expect(page.locator('[data-region="TaskTrail"]').getByLabel('DPUse Application Emulator')).toBeVisible(); // The connection has loaded, which the diagram's link needs.
        await page.getByRole('link', { name: 'Diagram' }).click();
        await expect(page).toHaveURL(new RegExp(`/dataViews/diagram/.+/${dataViewId}`));
        const node = page.locator('[data-region="DataViewDiagram"] g[role="button"][aria-label="People"]');
        await expect(node).toHaveCount(1, { timeout: 15_000 }); // The diagram's tool loads when the diagram is first shown.
        await page.locator('[data-region="DataViewDiagram"] svg').first().click({ position: { x: 4, y: 4 } }); // A corner, away from every node.
        await expect(page).not.toHaveURL(new RegExp(`/${dataViewId}$`));
        await node.locator('circle').first().click(); // The node's disc, because the middle of the node's box, which takes in its label, can be empty.
        await expect(page).toHaveURL(new RegExp(`/dataViews/diagram/.+/${dataViewId}`));
        await node.locator('circle').first().dblclick();
        await expect(page).toHaveURL(new RegExp(`/dataViews/${dataViewId}/items`)); // At its item, because its records are not loaded.
    });

    test('keeps the list and the diagram on a narrow screen, with the selected data view’s detail in a sheet over their foot', async ({ browserName, page }) => {
        // eslint-disable-next-line playwright/no-skipped-test -- Firefox and WebKit fail to load the page at random, as the first test says.
        test.skip(browserName !== 'chromium', 'Firefox and WebKit fail to load the page at random.');

        await page.goto('/dataViews/list');
        await page.locator('[data-region="PillButton"]').getByText('Data View', { exact: true }).click();
        await page.getByRole('button', { name: 'DPUse Application Emulator', exact: true }).click();
        await page.getByRole('button', { name: 'Select', exact: true }).click();
        await page.getByRole('button', { name: 'Table: People' }).click();
        await page.locator('[data-region="DataViewPill"]').getByRole('button', { name: 'Save' }).click();
        await expect(page).toHaveURL(/\/dataViews\/(?!new\/)[^/]+\/items/);
        const dataViewId = /\/dataViews\/([^/]+)\/items/.exec(page.url())?.[1] ?? '';

        // Too narrow for the detail to sit beside the list, so it is a sheet, which starts at its lowest, showing the top of
        // the detail.
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`/dataViews/list/${dataViewId}`);
        const sheet = page.getByRole('region', { name: 'Details of the selection' });
        const card = page.locator('[data-region="ConfigCard"]');
        await expect(sheet).toHaveAttribute('data-position', 'summary');
        await expect(sheet.getByRole('heading', { level: 1, name: 'Untitled Data View' })).toBeVisible();
        await expect(card).toBeVisible();

        // The handle raises the sheet to half height, where the detail shows and the list is still on screen.
        await sheet.getByRole('button', { name: 'Show more details' }).click();
        await expect(sheet).toHaveAttribute('data-position', 'half');
        await expect(sheet.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(card).toBeVisible();

        // A drag of the handle moves the sheet to the position nearest to where it is let go: up to its whole height,
        // then most of the way down to its summary. Its close button hides it.
        await dragBy(page, sheet.getByRole('button', { name: 'Show more details' }), -200);
        await expect(sheet).toHaveAttribute('data-position', 'full');
        await dragBy(page, sheet.getByRole('button', { name: 'Show fewer details' }), 600);
        await expect(sheet).toHaveAttribute('data-position', 'summary');
        await sheet.getByRole('button', { name: 'Close details' }).click();
        await expect(sheet).toBeHidden();

        // The diagram stays on screen with the sheet at its summary, whose action opens the data view.
        await expect(page.locator('[data-region="TaskTrail"]').getByLabel('DPUse Application Emulator')).toBeVisible(); // The connection has loaded, which the diagram's link needs.
        await page.getByRole('link', { name: 'Diagram' }).click();
        await expect(page.locator('[data-region="DataViewDiagram"] g[role="button"][aria-label="People"]')).toHaveCount(1, { timeout: 15_000 }); // The diagram's tool loads when the diagram is first shown.
        await page.getByRole('link', { name: 'List' }).click(); // A closed sheet opens again when the selected card is tapped.
        await card.click();
        await expect(sheet).toHaveAttribute('data-position', 'summary');
        await sheet.getByRole('button', { name: 'Open', exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`/dataViews/${dataViewId}/items`));
    });
});

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// Drags the element down by the given distance, or up when it is negative, in steps, as a pointer moves.
async function dragBy(page: Page, locator: Locator, distance: number): Promise<void> {
    await locator.hover(); // Waits for the element to stop moving, which a sheet still sliding has not.
    const box = await locator.boundingBox();
    if (box == null) throw new Error('The element to drag is not on screen.');
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y + distance, { steps: 8 });
    await page.mouse.up();
}
