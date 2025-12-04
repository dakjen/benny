// eslint.config.mjs
import pluginNext from '@next/eslint-plugin-next'
import parser from '@typescript-eslint/parser' // ok even if you mostly use JS

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    // Add top-level ignores for generated files
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
    ],
  },
  {
    name: 'next-core-web-vitals',
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@next/next': pluginNext,
    },
    rules: {
      // Next.js recommended rules
      ...pluginNext.configs.recommended.rules,
      // Core Web Vitals stricter rules
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
]