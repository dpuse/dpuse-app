// ── External Dependencies & Registrations
import { dpuseBaseESLintConfig } from '@dpuse/eslint-config-dpuse';
import pluginCompat from 'eslint-plugin-compat';
import pluginCSS from '@eslint/css';
import pluginJS from '@eslint/js';
import pluginJSON from '@eslint/json';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginTailwindCSS from 'eslint-plugin-tailwindcss';
import pluginVitest from '@vitest/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility';
import process from 'node:process';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { tailwind4 } from 'tailwind-csstree';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

// ── Constants ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Everything except code files, for 'ignores'. Limiting by 'ignores' rather than 'files' keeps rules off other languages
// without also telling ESLint to lint code files it otherwise would not.
const NON_CODE_FILES = ['**/*', '!**/*.{cjs,cts,js,jsx,mjs,mts,ts,tsx,vue}'];

// ── ESLint Configuration ─────────────────────────────────────────────────────────────────────────────────────────────

/**
@type {import('eslint').Linter.Config[]}
*/
const config = defineConfigWithVueTs(
    // ESLint's own recommended rules. Before the TypeScript configs, which switch off the ones TypeScript checks better.
    pluginJS.configs.recommended,

    // Linting scope and module resolver. TypeScript parser is handled by defineConfigWithVueTs.
    {
        name: 'app/files-to-lint',
        files: ['**/*.{vue,ts,mts,tsx}'],
        languageOptions: {
            parserOptions: { projectService: true, tsconfigRootDir: process.cwd() }
        },
        settings: {
            'import-x/core-modules': ['@dpuse/dpuse-shared', 'eslint/config'],
            'import-x/resolver': { typescript: { project: ['./tsconfig.json'] } }
        }
    },

    // Vue-specific plugin configurations.
    ...pluginVue.configs['flat/recommended'],
    ...pluginVueA11y.configs['flat/recommended'],
    vueTsConfigs.strictTypeChecked,
    vueTsConfigs.stylisticTypeChecked,
    { ...pluginTailwindCSS.configs['recommended'], files: ['**/*.{vue,ts,mts,tsx,js,jsx}'] },
    { ...pluginPlaywright.configs['flat/recommended'], files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'] },
    { ...pluginVitest.configs.recommended, files: ['src/**/__tests__/*'] },
    // Browser API support, checked against 'browserslist' in 'package.json'. Scoped to 'src' because the e2e specs
    // and the config files run in Node, where the browser floor does not apply.
    { ...pluginCompat.configs['flat/recommended'], files: ['src/**/*.{vue,ts,mts,tsx}'], ignores: ['src/**/__tests__/**'] },
    skipFormatting,

    // Shared DPUse base configuration: ignores, import-x/jsdoc/regexp/security/sonarjs/unicorn, Markdown, and common rule
    // overrides.
    ...dpuseBaseESLintConfig({
        files: ['**/*.{vue,ts,mts,tsx}'],
        ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'playwright-report/**', 'pwa.assets.config.ts', 'test-results/**'],
        rules: {
            'no-empty': 'warn',
            'prefer-const': 'warn',

            // eslint-plugin-n checks against Node.js runtime support; dpuse-app runs in the browser, so its checks don't apply.
            'n/no-unsupported-features/es-syntax': 'off',
            'n/no-unsupported-features/node-builtins': 'off',

            // A disable at the very top of a file covers the whole file without a closing enable.
            '@eslint-community/eslint-comments/disable-enable-pair': ['error', { allowWholeFile: true }],

            '@typescript-eslint/consistent-type-imports': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-import-type-side-effects': 'warn',
            // '@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true }],
            '@typescript-eslint/strict-boolean-expressions': 'warn',

            'sonarjs/cognitive-complexity': 'warn',
            'sonarjs/deprecation': 'warn',
            'sonarjs/no-selector-parameter': 'warn',
            'sonarjs/todo-tag': 'off',
            'sonarjs/unused-import': 'warn',
            'sonarjs/void-use': 'off', // `void ref.value` is the Vue idiom for explicit dependency tracking in computed().

            'tailwindcss/no-custom-classname': [
                'warn',
                {
                    whitelist: [
                        'busy-bar-shimmer',
                        'ddp--detail',
                        'ddp-back',
                        'ddp-detail',
                        'ddp-list',
                        'dialog-modal',
                        'dialog-modal-content-height',
                        'dpuse-collaborative-editor',
                        'dpuse-horizontal-slide-ltr-element',
                        'dpuse-nav-progress-bar-shimmer',
                        'dpuse-outside-click-ignore',
                        'dpuse-pending-letter',
                        'dpuse-scroll-area',
                        'dpuse-scroll-area-h',
                        'dpuse-scroll-area-wrapper',
                        'dpuse-scroll-area-v',
                        'dpuse-search-input',
                        'dpuse-scrollbar-thumb',
                        'dpuse-scrollbar-track',
                        'dpuse-scrollbar-track-h',
                        'dpuse-scrollbar-track-v',
                        'dpuse-scrollbar-visible',
                        'dpuse-table-scroll-h',
                        'dpuse-table-scroll-v',
                        'dpuse-prose',
                        'dpuse-prose-overline',
                        'dpuse-studio-prose',
                        'pell-editor',
                        'session-menu',
                        'error-notice',
                        'owns-screen',
                        'is-region',
                        'covers-region',
                        'notice-badge',
                        'notice-badge-body',
                        'notice-card',
                        'detail-dialog',
                        'screen-dialog',
                        String.raw`.*stroke-1\.25` // Valid decimal stroke-width utility; the plugin's static class list doesn't recognise it.
                    ]
                }
            ],

            'unicorn/filename-case': [
                'error',
                { cases: { camelCase: true, pascalCase: true }, ignore: ['__tests__', 'DPUseLogo.vue', 'ContextERDPanel.vue', /PENDING\.vue$/ /*'src/components/icon(?:/.*)?'*/] } // 'PENDING' marks a parked component.
            ],
            'unicorn/no-non-function-verb-prefix': 'off',
            'unicorn/prefer-top-level-await': 'warn',

            'vue/multi-word-component-names': ['warn', { ignores: ['Breadcrumbs', 'Button', 'Dialog', 'Grid', 'Input', 'Pill', 'Separator', 'Table', 'Tag'] }],
            'vue/no-bare-strings-in-template': 'error',
            'vue/no-v-html': ['error', { ignorePattern: String.raw`^(?:icon|.*\.icon|purified|purify|renderText\()` }],
            'vue/require-default-prop': 'off', // Too much noise for properties with undefined values.

            'vuejs-accessibility/label-has-for': ['error', { required: { some: ['id', 'nesting'] } }]
        }
    }),

    // CSS files. Only '.css' files are checked, not the '<style>' blocks in Vue files. 'tailwind4' teaches the parser
    // Tailwind's at-rules ('@theme', '@utility', …), which it would otherwise report as invalid.
    {
        files: ['**/*.css'],
        plugins: { css: pluginCSS },
        language: 'css/css',
        languageOptions: { customSyntax: tailwind4 },
        rules: {
            ...pluginCSS.configs.recommended.rules,
            'css/no-invalid-properties': ['error', { allowUnknownVariables: true }], // Variables come from Tailwind's import or are declared further down the file.
            'css/use-baseline': ['error', { allowProperties: ['overscroll-behavior', 'overscroll-behavior-x'] }] // Not Baseline because of older Safari; the Safari 26 floor in 'browserslist' supports them.
        }
    },

    // Locale files, one per component. Their 'TEXT' keys are kept alphabetical so each table reads like an index, and a
    // key entered twice would silently lose its first value.
    {
        files: ['src/**/*_.json'],
        plugins: { json: pluginJSON },
        language: 'json/json',
        rules: {
            ...pluginJSON.configs.recommended.rules,
            'json/sort-keys': 'error'
        }
    },

    // `DataViewsLayout`'s `TASK_CONFIGS` is a list of tasks, each reading id first, so its keys are not sorted.
    {
        files: ['src/features/studio/dataViews/DataViewsLayout_.json'],
        rules: {
            'json/sort-keys': 'off'
        }
    },

    // Unimplemented panels: their only content is a placeholder line naming what will go there, and
    // `ManagePersonalDetailsPanel` is numbered filler for testing scrolling. Translating any of it would be work thrown
    // away when the panel is built, so the rule is lifted until then.
    {
        files: [
            'src/features/session/accountPanel/DeleteAccountPanel.vue',
            'src/features/session/accountPanel/GenerateTokenPanel.vue',
            'src/features/session/accountPanel/ManageAccessPanel.vue',
            'src/features/session/accountPanel/ManageDataServiceTokensPanel.vue',
            'src/features/session/accountPanel/ManagePersonalDetailsPanel.vue',
            'src/features/session/accountPanel/ManageSessionsPanel.vue',
            'src/features/session/accountPanel/ManageSubscriptionPanel.vue',
            'src/features/session/accountPanel/ReviewActivityPanel.vue',
            'src/features/studio/connectionPanel/ManageConnectionPanel.vue',
            'src/features/studio/dataViews/auditContent/AuditContentPanel.vue'
        ],
        rules: {
            'vue/no-bare-strings-in-template': 'off'
        }
    },

    // `AddConnectionForm` dumps the connector's raw config field by field for diagnosis, and `LibraryDocumentPanel`
    // shows sample copy that stands in for a real document. Neither is wording a user is meant to read as English.
    // `ManagePreferencesPanel` names each language in that language, which is how language pickers are written.
    {
        files: [
            'src/features/assistant/library/LibraryDocumentPanel.vue',
            'src/features/session/accountPanel/ManagePreferencesPanel.vue',
            'src/features/studio/connectionPanel/AddConnectionForm.vue'
        ],
        rules: {
            'vue/no-bare-strings-in-template': 'off'
        }
    },

    // `PaneSplitter` is an ARIA window splitter: a focusable `separator` carrying pointer and keyboard handlers, which the
    // rule does not recognise as interactive.
    {
        files: ['src/components/ui/PaneSplitter.vue'],
        rules: {
            'vuejs-accessibility/no-static-element-interactions': 'off'
        }
    },

    // `eslint-plugin-tailwindcss`'s own recommended config ships an empty `settings.tailwindcss`, which would
    // otherwise clobber the `cssConfigPath` set above since ESLint merges `settings` shallowly per matching config.
    {
        files: ['**/*.{vue,ts,mts,tsx,js,jsx}'],
        settings: {
            tailwindcss: {
                cssConfigPath: new URL('src/assets/main.css', import.meta.url).pathname
            }
        }
    }
).map((entry) => limitToCodeFiles(entry));

// ── Helpers ──────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Limits a config that applies to every linted file to code files, as ESLint refuses to run JavaScript rules on CSS,
JSON or Markdown. The Vue and TypeScript presets are written this way; blocks naming their own files are left alone. The
code-file patterns go first, because a later pattern wins, and a config may already narrow itself further (e.g. to
TypeScript). */
function limitToCodeFiles(config) {
    const isGlobalIgnores = Object.keys(config).every((key) => key === 'ignores' || key === 'name');
    return isGlobalIgnores || config.files !== undefined ? config : { ...config, ignores: [...NON_CODE_FILES, ...(config.ignores ?? [])] };
}

export default config;
