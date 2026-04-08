const base = require('./index.js')

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...base,
  {
    files: ['**/*.{tsx,jsx}'],
    plugins: {
      'react-hooks': require('eslint-plugin-react-hooks'),
      'react-refresh': require('eslint-plugin-react-refresh'),
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
]
