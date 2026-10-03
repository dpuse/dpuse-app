// ── External Dependencies & Registrations
import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

// ── Playwright Configuration ─────────────────────────────────────────────────────────────────────────────────────────

// TODO: Add axe-core to the end-to-end tests (@axe-core/playwright). The ESLint accessibility rules only see plain
// HTML elements in the template source; axe checks the page as the browser actually shows it, so it also covers
// custom components, values bound at runtime, and colour contrast. Add a test that opens each main screen and fails on
// any axe violation.

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config = defineConfig({
    testDir: './e2e',
    /*
    Maximum time one test can run for.
    */
    timeout: 30 * 1000,
    expect: {
        /**
         * Maximum time expect() should wait for the condition to be met.
         * For example in `await expect(locator).toHaveText();`
         */
        timeout: 5000
    },
    /*
    Fail the build on CI if you accidentally left test.only in the source code.
    */
    forbidOnly: process.env.CI != null,
    /*
    Retry on CI only
    */
    retries: process.env.CI == null ? 0 : 2,
    /*
    Opt out of parallel tests on CI.
    */
    workers: process.env.CI == null ? undefined : 1,
    /*
    Reporter to use. See https://playwright.dev/docs/test-reporters
    */
    reporter: 'html',
    /*
    Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions.
    */
    use: {
        /*
        Maximum time each action such as `click()` can take. Defaults to 0 (no limit).
        */
        actionTimeout: 0,
        /*
        Base URL to use in actions like `await page.goto('/')`.
        */
        baseURL: process.env.CI == null ? 'http://localhost:5173' : 'http://localhost:4173',

        /*
        Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer
        */
        trace: 'on-first-retry',

        /*
        Only on CI systems run the tests headless
        */
        headless: true // !!process.env.CI,
    },

    /*
    Configure projects for major browsers
    */
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome']
            }
        },
        {
            name: 'firefox',
            use: {
                ...devices['Desktop Firefox']
            }
        },
        {
            name: 'webkit',
            use: {
                ...devices['Desktop Safari']
            }
        }

        /*
        Test against mobile viewports.
        */
        // {
        //   name: 'Mobile Chrome',
        //   use: {
        //     ...devices['Pixel 5'],
        //   },
        // },
        // {
        //   name: 'Mobile Safari',
        //   use: {
        //     ...devices['iPhone 12'],
        //   },
        // },

        /*
        Test against branded browsers.
        */
        // {
        //   name: 'Microsoft Edge',
        //   use: {
        //     channel: 'msedge',
        //   },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: {
        //     channel: 'chrome',
        //   },
        // },
    ],

    /*
    Folder for test artifacts such as screenshots, videos, traces, etc.
    */
    // outputDir: 'test-results/',

    /*
    Run your local dev server before starting the tests
    */
    webServer: {
        /**
         * Use the dev server by default for faster feedback loop.
         * Use the preview server on CI for more realistic testing.
         * Playwright will re-use the local server if there is already a dev-server running.
         */
        command: process.env.CI == null ? 'npm run dev' : 'npm run preview',
        port: process.env.CI == null ? 5173 : 4173,
        reuseExistingServer: process.env.CI == null
    }
});

export default config;
