const base = require('./index.js')

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...base,
  {
    files: ['**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
    },
  },
]
