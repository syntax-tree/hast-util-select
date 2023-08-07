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
  const ids = query.ids
  assert(ids, 'expected `ids`')
  return ids.length === 1 && element.properties.id === ids[0]
}
