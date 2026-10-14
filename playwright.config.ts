// ── External Dependencies & Registrations
import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

// ── Playwright Configuration ─────────────────────────────────────────────────────────────────────────────────────────

const config = defineConfig({
    testDir: './e2e',
    timeout: 30 * 1000,
    expect: {
        timeout: 5000
    },
    forbidOnly: process.env.CI != null,
    retries: process.env.CI == null ? 0 : 2,
    workers: process.env.CI == null ? undefined : 1,
    reporter: process.env.CI == null ? 'html' : 'github', // CI shows failures as annotations on the commit, where nobody would open an HTML report.
    use: {
        actionTimeout: 10_000, // A stuck action fails by itself and names the element, rather than waiting for the whole test to time out.
        baseURL: process.env.CI == null ? 'https://localhost:5173' : 'https://localhost:4173', // HTTPS because 'vite.config.ts' serves both dev and preview over it, for desktop Safari.
        ignoreHTTPSErrors: process.env.CI != null, // CI serves with a throwaway self-signed certificate, which no browser trusts.
        trace: 'on-first-retry'
    },

    // CI runs Chromium only, to keep every push quick. Firefox and WebKit run locally.
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
    ].filter((project) => process.env.CI == null || project.name === 'chromium'),

    /*
    Folder for test artifacts such as screenshots, videos, traces, etc.
    */
    // outputDir: 'test-results/',

    // CI tests the production build through 'vite preview', so it checks what users get. Locally the dev server is
    // quicker, and one already running is reused.
    webServer: {
        command: process.env.CI == null ? 'npm run dev' : 'npm run preview',
        port: process.env.CI == null ? 5173 : 4173,
        reuseExistingServer: process.env.CI == null
    }
});

export default config;
