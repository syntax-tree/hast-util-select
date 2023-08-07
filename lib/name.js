/**
 * @typedef {import('css-selector-parser').AstRule} AstRule
 * @typedef {import('./types.js').Element} Element
 */

import {ok as assert} from 'devlop'

/**
 * Check whether an element has a tag name.
 *
 * @param {AstRule} query
 * @param {Element} element
 * @returns {boolean}
 */
export function name(query, element) {
  assert(query.tag, 'expected `tag`')
  return query.tag.type === 'WildcardTag' || query.tag.name === element.tagName
}
