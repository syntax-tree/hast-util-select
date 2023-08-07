/**
 * @typedef {import('css-selector-parser').AstRule} AstRule
 * @typedef {import('./types.js').Element} Element
 */

import {ok as assert} from 'devlop'

/**
 * Check whether an element has an ID.
 *
 * @param {AstRule} query
 * @param {Element} element
 * @returns {boolean}
 */
export function id(query, element) {
  assert(query.ids, 'expected `ids`')
  const id = query.ids[query.ids.length - 1]
  return Boolean(element.properties && element.properties.id === id)
}
