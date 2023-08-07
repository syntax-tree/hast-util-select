/**
 * @typedef {import('css-selector-parser').AstRule} AstRule
 *
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Parents} Parents
 *
 * @typedef {import('./index.js').State} State
 */

import {attribute} from './attribute.js'
import {className} from './class-name.js'
import {id} from './id.js'
import {name} from './name.js'
import {pseudo} from './pseudo.js'

/**
 * Test a rule.
 *
 * @param {AstRule} query
 *   AST rule (with `pseudoClasses`).
 * @param {Element} element
 *   Element.
 * @param {number | undefined} index
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} parent
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function test(query, element, index, parent, state) {
  if (query.pseudoElement) {
    throw new Error('Invalid selector: `::' + query.pseudoElement + '`')
  }

  return Boolean(
    (!query.tag || name(query, element)) &&
      (!query.classNames || className(query, element)) &&
      (!query.ids || id(query, element)) &&
      (!query.attributes || attribute(query, element, state.schema)) &&
      (!query.pseudoClasses || pseudo(query, element, index, parent, state))
  )
}
