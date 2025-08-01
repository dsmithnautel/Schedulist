module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    'cypress/globals': true,
    node: true  // Add this for Cypress plugins
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  settings: {
    react: {
      version: '18.2'
    }
  },
  plugins: [
    'react-refresh',
    'cypress'
  ],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-console': ['error', { allow: ['warn', 'error'] }]  // Updated console rule
  },
  overrides: [
    {
      files: ['cypress/**/*.js'],
      env: {
        'cypress/globals': true,
        node: true
      }
    }
  ]
}