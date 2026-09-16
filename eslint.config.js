import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '.claude']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  // Les globales navigateur ci-dessus ne valent pas partout : sans ces deux blocs, ESLint
  // signalait 40 `no-undef` fictifs (`process`, `Buffer`, `clients`). Le `no-undef` qui
  // compte, celui de src/ (import manquant → ReferenceError au rendu), n'est pas concerné.
  {
    // Fonctions serverless Vercel : runtime Node.
    files: ['api/**/*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Service worker : `self`, `clients`, `caches`…
    files: ['public/sw.js'],
    languageOptions: { globals: globals.serviceworker },
  },
])
