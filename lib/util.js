/**
 * @typedef {import('./types.js').Node} Node
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').Parent} Parent
 * @typedef {import('hast-util-is-element').AssertPredicate<Element>} IsElement
 */

import {convertElement} from 'hast-util-is-element'

/**
 * @param {Node} node
 * @returns {node is Parent}
 */
export function parent(node) {
  return Array.isArray(node.children)
}

/** @type {IsElement} */
// @ts-ignore it works.
export const element = convertElement()
