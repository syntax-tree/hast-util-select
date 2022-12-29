/**
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').Node} Node
 * @typedef {import('./types.js').Parent} Parent
 * @typedef {import('./types.js').SelectState} SelectState
 */

import {attribute} from './attribute.js'
import {className} from './class-name.js'
import {id} from './id.js'
import {name} from './name.js'
import {pseudo} from './pseudo.js'

/**
 * Test a rule.
 *
 * @param {Rule} query
 * @param {Node} node
 * @param {number | undefined} index
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
export function test(query, node, index, parent, state) {
  return Boolean(
    node.type === 'element' &&
      state.schema &&
      (!query.tagName || name(query, node)) &&
      (!query.classNames || className(query, node)) &&
      (!query.id || id(query, node)) &&
      (!query.attrs || attribute(query, node, state.schema)) &&
      (!query.pseudos || pseudo(query, node, index, parent, state))
  )
}
