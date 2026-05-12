// External Dependencies
import { globalIgnores } from 'eslint/config';
import type { Linter } from 'eslint';
import pluginComments from '@eslint-community/eslint-plugin-eslint-comments';
import pluginImport from 'eslint-plugin-import-x';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginRegexp from 'eslint-plugin-regexp';
import pluginSecurity from 'eslint-plugin-security';
import pluginSonarJS from 'eslint-plugin-sonarjs';
import pluginTailwindCSS from 'eslint-plugin-tailwindcss';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginVitest from '@vitest/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

// ESLint Configuration ────────────────────────────────────────────────────────────────────────────────────────────────

export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{vue,ts,mts,tsx}'],
        settings: {
            'import-x/core-modules': ['@dpuse/dpuse-shared/errors', 'eslint/config'],
            'import-x/resolver': { typescript: { project: ['./tsconfig.json'] } },
            tailwindcss: {
                cssConfigPath: new URL('src/assets/main.css', import.meta.url).pathname
            }
        }
    },

    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'pwa.assets.config.ts']),

    ...pluginVue.configs['flat/recommended'],
    ...pluginVueA11y.configs['flat/recommended'],
    vueTsConfigs.recommended,
    {
        // eslint-plugin-eslint-comments only ships a legacy config; manually convert to flat format
        plugins: { '@eslint-community/eslint-comments': pluginComments },
        rules: {
            '@eslint-community/eslint-comments/disable-enable-pair': 'error',
            '@eslint-community/eslint-comments/no-aggregating-enable': 'error',
            '@eslint-community/eslint-comments/no-duplicate-disable': 'error',
            '@eslint-community/eslint-comments/no-unlimited-disable': 'error',
            '@eslint-community/eslint-comments/no-unused-enable': 'error'
        }
    },
    pluginImport.flatConfigs.recommended,
    pluginRegexp.configs['flat/recommended'],
    pluginSecurity.configs.recommended,
    (pluginSonarJS.configs?.recommended ?? {}) as Linter.Config,
    pluginTailwindCSS.configs['flat/recommended'],
    pluginUnicorn.configs.recommended,

    { ...pluginPlaywright.configs['flat/recommended'], files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'] },

    { ...pluginVitest.configs.recommended, files: ['src/**/__tests__/*'] },

    skipFormatting,

    {
        rules: {
            'no-empty': 'warn',
            'prefer-const': 'warn',

            '@typescript-eslint/consistent-type-imports': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'warn',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-import-type-side-effects': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/restrict-template-expressions': ['warn', { allowNumber: true }],
            '@typescript-eslint/strict-boolean-expressions': 'warn',

            'import-x/no-duplicates': 'warn',
            'sort-imports': ['warn', { allowSeparatedGroups: true, ignoreCase: true, memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'] }],

            '@eslint-community/eslint-comments/require-description': 'warn',

            'security/detect-object-injection': 'off',

            'sonarjs/cognitive-complexity': 'warn',
            'sonarjs/deprecation': 'off',
            'sonarjs/no-commented-code': 'warn',
            'sonarjs/no-dead-store': 'warn',
            'sonarjs/no-selector-parameter': 'off',
            'sonarjs/no-unused-vars': 'warn',
            'sonarjs/unused-import': 'warn',
            'sonarjs/todo-tag': 'off',
            'sonarjs/void-use': 'off', // `void ref.value` is the Vue idiom for explicit dependency tracking in computed()

            'tailwindcss/no-custom-classname': [
                'warn',
                {
                    whitelist: [
                        'bg-card',
                        'bg-card-hover',
                        'bg-surface',
                        'border-separator',
                        'outline-boundary',
                        'outline-boundary-hover',
                        'text-content',
                        'text-muted',
                        'to-surface/95',
                        'via-surface/80'
                    ]
                }
            ],

            'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true }, ignore: ['App.vue', 'DPUseLogo.vue' /*'src/components/icon(?:/.*)?'*/] }],
            'unicorn/no-null': 'off',
            'unicorn/prevent-abbreviations': ['error', { ignore: ['env.d.ts'] }],
            'unicorn/switch-case-braces': 'off',
            'unicorn/prefer-top-level-await': 'off',

            'vue/multi-word-component-names': 'off',
            'vue/no-bare-strings-in-template': ['off'],
            'vue/no-v-html': 'off',
            'vue/require-default-prop': 'off',

            'vuejs-accessibility/label-has-for': ['error', { required: { some: ['id', 'nesting'] } }]
        }
    }
);
