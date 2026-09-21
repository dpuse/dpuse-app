// ── External Dependencies & Registrations
import { dpuseBaseESLintConfig } from '@dpuse/eslint-config-dpuse';
import pluginCompat from 'eslint-plugin-compat';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginTailwindCSS from 'eslint-plugin-tailwindcss';
import pluginVitest from '@vitest/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

// ── ESLint Configuration ─────────────────────────────────────────────────────────────────────────────────────────────

/**
@type {import('eslint').Linter.Config[]}
*/
const config = defineConfigWithVueTs(
    // Linting scope and module resolver. TypeScript parser is handled by defineConfigWithVueTs.
    {
        name: 'app/files-to-lint',
        files: ['**/*.{vue,ts,mts,tsx}'],
        languageOptions: {
            parserOptions: { projectService: true, tsconfigRootDir: process.cwd() }
        },
        settings: {
            'import-x/core-modules': ['@dpuse/dpuse-shared/errors', 'eslint/config'],
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

    // Shared DPUse base configuration: ignores, import-x/regexp/security/sonarjs/unicorn, and common rule overrides.
    ...dpuseBaseESLintConfig({
        files: ['**/*.{vue,ts,mts,tsx}'],
        ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'pwa.assets.config.ts'],
        rules: {
            'no-empty': 'warn',
            'prefer-const': 'warn',

            // eslint-plugin-n checks against Node.js runtime support; dpuse-app runs in the browser, so its checks don't apply.
            'n/no-unsupported-features/es-syntax': 'off',
            'n/no-unsupported-features/node-builtins': 'off',

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
                { cases: { camelCase: true, pascalCase: true }, ignore: ['__tests__', 'DPUseLogo.vue', 'ContextERDPanel.vue' /*'src/components/icon(?:/.*)?'*/] }
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
);

export default config;
