/**
 * @typedef {import('./lib/types.js').Element} Element
 * @typedef {import('./lib/types.js').Node} Node
 * @typedef {import('./lib/types.js').Space} Space
 * @typedef {import('./lib/types.js').SelectState} SelectState
 */

import {html, svg} from 'property-information'
import {any} from './lib/any.js'
import {parse} from './lib/parse.js'

/**
 * Check that the given `node` matches `selector`.
 *
 * This only checks the element itself, not the surrounding tree.
 * Thus, nesting in selectors is not supported (`p b`, `p > b`), neither are
 * selectors like `:first-child`, etc.
 * This only checks that the given element matches the selector.
 *
 * @param {string} selector
 *   CSS selector, such as (`h1`, `a, b`).
 * @param {Node | null | undefined} [node]
 *   Node that might match `selector`, should be an element.
 * @param {Space | null | undefined} [space='html']
 *   Name of namespace (`'svg'` or `'html'`).
 * @returns {boolean}
 *   Whether `node` matches `selector`.
 */
export function matches(selector, node, space) {
  const state = createState(node, space)
  state.one = true
  state.shallow = true
  any(parse(selector), node || undefined, state)
  return state.results.length > 0
}

/**
 * Select the first element that matches `selector` in the given `tree`.
 * Searches the tree in *preorder*.
 *
 * @param {string} selector
 *   CSS selector, such as (`h1`, `a, b`).
 * @param {Node | null | undefined} [tree]
 *   Tree to search.
 * @param {Space | null | undefined} [space='html']
 *   Name of namespace (`'svg'` or `'html'`).
 * @returns {Element | null}
 *   First element in `tree` that matches `selector` or `null` if nothing is
 *   found.
 *   This could be `tree` itself.
 */
export function select(selector, tree, space) {
  const state = createState(tree, space)
  state.one = true
  any(parse(selector), tree || undefined, state)
  // To do in major: return `undefined` instead.
  return state.results[0] || null
}

/**
 * Select all elements that match `selector` in the given `tree`.
 * Searches the tree in *preorder*.
 *
 * @param {string} selector
 *   CSS selector, such as (`h1`, `a, b`).
 * @param {Node | null | undefined} [tree]
 *   Tree to search.
 * @param {Space | null | undefined} [space='html']
 *   Name of namespace (`'svg'` or `'html'`).
 * @returns {Array<Element>}
 *   Elements in `tree` that match `selector`.
 *   This could include `tree` itself.
 */
export function selectAll(selector, tree, space) {
  const state = createState(tree, space)
  any(parse(selector), tree || undefined, state)
  return state.results
}

/**
 * @param {Node | null | undefined} [tree]
 *   Tree to search.
 * @param {Space | null | undefined} [space='html']
 *   Name of namespace (`'svg'` or `'html'`).
 * @returns {SelectState} SelectState
 */
export function createState(tree, space) {
  return {
    results: [],
    // @ts-expect-error assume elements.
    scopeElements: tree ? (tree.type === 'root' ? tree.children : [tree]) : [],
    iterator: undefined,
    one: false,
    shallow: false,
    index: false,
    found: false,
    schema: space === 'svg' ? svg : html,
    language: undefined,
    direction: 'ltr',
    editableOrEditingHost: false,
    typeIndex: undefined,
    elementIndex: undefined,
    typeCount: undefined,
    elementCount: undefined
  }
}
