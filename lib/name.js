/**
 * @typedef {import('css-selector-parser').AstRule} AstRule
 *
 * @typedef {import('hast').Element} Element
 */

import {ok as assert} from 'devlop'

/**
 * Check whether an element has a tag name.
 *
 * @param {AstRule} query
 *   AST rule (with `tag`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function name(query, element) {
  assert(query.tag, 'expected `tag`')
  return query.tag.type === 'WildcardTag' || query.tag.name === element.tagName
}
