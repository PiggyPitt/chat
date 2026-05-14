module.exports = {
  root: true,
  env: {
    node: true,
    es2023: true,
    jest: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module'
  },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': ['error', { alphabetize: { order: 'asc', caseInsensitive: true } }],
    'no-console': 'warn'
  },
  settings: {
    'import/resolver': {
      typescript: {}
    }
  }
};
