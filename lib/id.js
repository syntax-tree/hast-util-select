/**
 * @typedef {import('css-selector-parser').AstRule} AstRule
 *
 * @typedef {import('hast').Element} Element
 */

import {ok as assert} from 'devlop'

/**
 * Check whether an element has an ID.
 *
 * @param {AstRule} query
 *   AST rule (with `ids`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function id(query, element) {
  assert(query.ids, 'expected `ids`')
  const id = query.ids[query.ids.length - 1]
  return Boolean(element.properties.id === id)
}
