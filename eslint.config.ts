import { globalIgnores } from 'eslint/config';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import pluginVue from 'eslint-plugin-vue';
import pluginPlaywright from 'eslint-plugin-playwright';
import pluginVitest from '@vitest/eslint-plugin';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
    {
        name: 'app/files-to-lint',
        files: ['**/*.{vue,ts,mts,tsx}']
    },

    globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

    ...pluginVue.configs['flat/essential'],
    vueTsConfigs.recommended,

    {
        ...pluginPlaywright.configs['flat/recommended'],
        files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}']
    },

    {
        ...pluginVitest.configs.recommended,
        files: ['src/**/__tests__/*']
    },

    skipFormatting,

    {
        rules: {
            'vue/multi-word-component-names': 'off',
            'vue/no-v-html': 'off'

            // 'import/no-duplicates': 'warn',
            // 'sort-imports': ['warn', { allowSeparatedGroups: true, ignoreCase: true, memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'] }],

            // 'security/detect-object-injection': 'off',

            // 'sonarjs/no-commented-code': 'warn',
            // 'sonarjs/no-dead-store': 'warn',
            // 'sonarjs/no-unused-vars': 'warn',
            // 'sonarjs/todo-tag': 'warn',

            // 'unicorn/filename-case': ['error', { cases: { camelCase: true, pascalCase: true }, ignore: ['App.vue', 'src/components/DPIcon(?:/.*)?'] }],
            // 'unicorn/no-null': 'off',
            // 'unicorn/prevent-abbreviations': ['error', { ignore: ['env.d.ts'] }]
        }
    }
);
