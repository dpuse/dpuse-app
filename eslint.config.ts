// External Dependencies
import { globalIgnores } from 'eslint/config';
import pluginImport from 'eslint-plugin-import-x';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginSecurity from 'eslint-plugin-security';
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
            'import-x/resolver': { typescript: { project: ['./tsconfig.json'] } }
        }
    },

    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**', 'pwa.assets.config.ts']),

    ...pluginVue.configs['flat/recommended'],
    ...pluginVueA11y.configs['flat/recommended'],
    vueTsConfigs.recommended,
    pluginImport.flatConfigs.recommended,
    pluginSecurity.configs.recommended,
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

            'security/detect-object-injection': 'off',

            // 'sonarjs/no-commented-code': 'warn',
            // 'sonarjs/no-dead-store': 'warn',
            // 'sonarjs/no-unused-vars': 'warn',
            // 'sonarjs/todo-tag': 'warn',

            'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true }, ignore: ['App.vue', 'DPUseLogo.vue' /*'src/components/icon(?:/.*)?'*/] }],
            'unicorn/no-null': 'off',
            'unicorn/prevent-abbreviations': ['error', { ignore: ['env.d.ts'] }],
            'unicorn/switch-case-braces': 'off',
            'unicorn/prefer-top-level-await': 'off',

            'vuejs-accessibility/label-has-for': ['error', { required: { some: ['id', 'nesting'] } }],

            'vue/multi-word-component-names': 'off',
            'vue/no-bare-strings-in-template': ['warn'],
            'vue/no-v-html': 'off',
            'vue/require-default-prop': 'off'
        }
    }
);
