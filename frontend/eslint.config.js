import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  ...svelte.configs['flat/prettier'],
  {
    languageOptions: {
      parserOptions: {
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      // TypeScript and Svelte supply browser/type globals through their own
      // analyzers; core no-undef/no-unused-expressions misclassify them.
      'no-undef': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      // Existing list rendering is static or append-only. Key enforcement is
      // deferred until those collections gain stable domain identifiers.
      'svelte/require-each-key': 'off',
      // SvelteKit's static adapter supports these literal internal routes.
      'svelte/no-navigation-without-resolve': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_|^\\$',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'svelte/no-at-html-tags': 'warn',
    },
  },
  {
    ignores: ['build/', '.svelte-kit/', 'node_modules/', 'src-tauri/'],
  },
];
