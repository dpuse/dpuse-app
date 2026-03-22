// External Dependencies
import { globalIgnores } from 'eslint/config';
import pluginImport from 'eslint-plugin-import';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginSecurity from 'eslint-plugin-security';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginVitest from '@vitest/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

// ESlint Configuration
export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{vue,ts,mts,tsx}'],
        settings: {
            'import/core-modules': ['@dpuse/dpuse-shared/errors', 'eslint/config'],
            'import/resolver': { typescript: { project: ['./tsconfig.json'] } }
        }
    },

    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

    ...pluginVue.configs['flat/recommended'],
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

            'import/no-duplicates': 'warn',
            'sort-imports': ['warn', { allowSeparatedGroups: true, ignoreCase: true, memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'] }],

            'security/detect-object-injection': 'off',

            // 'sonarjs/no-commented-code': 'warn',
            // 'sonarjs/no-dead-store': 'warn',
            // 'sonarjs/no-unused-vars': 'warn',
            // 'sonarjs/todo-tag': 'warn',

            'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true }, ignore: ['App.vue', 'DPUseLogoIcon.vue' /*'src/components/icon(?:/.*)?'*/] }],
            'unicorn/no-null': 'off',
            'unicorn/prevent-abbreviations': ['error', { ignore: ['env.d.ts'] }],
            'unicorn/switch-case-braces': 'off',
            'unicorn/prefer-top-level-await': 'off',

            'vue/multi-word-component-names': 'off',
            'vue/no-bare-strings-in-template': ['warn'],
            'vue/no-v-html': 'off',
            'vue/require-default-prop': 'off'
        }
    }
);
