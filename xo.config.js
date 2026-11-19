/**
 * @import {FlatXoConfig} from 'xo'
 */

/** @type {FlatXoConfig} */
const xoConfig = [
  {
    name: 'default',
    prettier: 'compat',
    rules: {
      curly: 'off',
      'import-x/order': 'off',
      'jsdoc/check-indentation': 'off',
      'jsdoc/check-line-alignment': 'off',
      'jsdoc/informative-docs': 'off',
      'jsdoc/require-asterisk-prefix': 'off',
      'no-shadow': 'off',
      'prefer-arrow-callback': 'off',
      'require-unicode-regexp': 'off',
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/logical-assignment-operators': 'off',
      'unicorn/max-nested-calls': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/prefer-early-return': 'off',
      'unicorn/prefer-includes-over-repeated-comparisons': 'off',
      'unicorn/prefer-simple-condition-first': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/require-array-sort-compare': 'off',
      'unicorn/single-line-block-comment-style': 'off'
    },
    space: true
  },
  {
    files: ['test/**/*.js'],
    rules: {
      'max-nested-callbacks': 'off',
      'no-await-in-loop': 'off'
    }
  },
  {
    files: ['package.json'],
    rules: {
      'package-json/no-orphan-types': 'off',
      'package-json/require-engines': 'off',
      'package-json/sort-files': 'off',
      'package-json/sort-properties': 'off'
    }
  }
]

export default xoConfig
