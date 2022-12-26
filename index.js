/**
 * @typedef {import('./lib/types.js').Element} Element
 * @typedef {import('./lib/types.js').Node} Node
 * @typedef {import('./lib/types.js').Space} Space
 */

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
  return Boolean(
    any(parse(selector), node || undefined, {
      space: space || undefined,
      one: true,
      shallow: true
    })[0]
  )
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
 * @returns {Element|null}
 *   First element in `tree` that matches `selector` or `null` if nothing is
 *   found.
 *   This could be `tree` itself.
 */
export function select(selector, tree, space) {
  // To do in major: return `undefined` instead.
  return (
    any(parse(selector), tree || undefined, {
      space: space || undefined,
      one: true
    })[0] || null
  )
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
  return any(parse(selector), tree || undefined, {space: space || undefined})
}
