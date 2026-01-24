// External dependencies
import { globalIgnores } from 'eslint/config';
import pluginImport from 'eslint-plugin-import';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginSecurity from 'eslint-plugin-security';
import pluginUnicorn from 'eslint-plugin-unicorn';
import pluginVitest from '@vitest/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';

// ESlint configuration
export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{vue,ts,mts,tsx}'],
        settings: {
            'import/core-modules': ['eslint/config'],
            'import/resolver': { typescript: { project: ['./tsconfig.json'] } }
        }
    },

    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

    ...pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,
    pluginImport.flatConfigs.recommended,
    pluginSecurity.configs.recommended,
    pluginUnicorn.configs.recommended,

    { ...pluginPlaywright.configs['flat/recommended'], files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'] },

    { ...pluginVitest.configs.recommended, files: ['src/**/__tests__/*'] },

    skipFormatting,

    {
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/no-v-html': 'off',

            'import/no-duplicates': 'warn',
            'sort-imports': ['warn', { allowSeparatedGroups: true, ignoreCase: true, memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'] }],

            'security/detect-object-injection': 'off',

            // 'sonarjs/no-commented-code': 'warn',
            // 'sonarjs/no-dead-store': 'warn',
            // 'sonarjs/no-unused-vars': 'warn',
            // 'sonarjs/todo-tag': 'warn',

            'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true }, ignore: ['App.vue', 'DPULogoIcon.vue' /*'src/components/icon(?:/.*)?'*/] }],
            'unicorn/no-null': 'off',
            'unicorn/prevent-abbreviations': ['error', { ignore: ['env.d.ts'] }]
        }
    }
);
