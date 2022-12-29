/**
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').Parent} Parent
 * @typedef {import('./types.js').SelectState} SelectState
 * @typedef {import('./types.js').SelectIterator} SelectIterator
 * @typedef {import('./types.js').Node} Node
 */

import {zwitch} from 'zwitch'
import {enterState} from './enter-state.js'

const own = {}.hasOwnProperty

/** @type {(query: Rule, node: Node, index: number | undefined, parent: Parent | undefined, state: SelectState) => void} */
const handle = zwitch('nestingOperator', {
  unknown: unknownNesting,
  // @ts-expect-error: hush.
  invalid: topScan, // `undefined` is the top query selector.
  handlers: {
    null: descendant, // `null` is the descendant combinator.
    '>': directChild,
    '+': adjacentSibling,
    '~': generalSibling
  }
})

/**
 * Nest a rule.
 *
 * @param {Rule} query
 * @param {Node} node
 * @param {number | undefined} index
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 */
export function nest(query, node, index, parent, state) {
  handle(query, node, index, parent, state)
}

// Shouldn’t be called, parser gives correct data.
/**
 * @param {unknown} query
 * @returns {never}
 */
/* c8 ignore next 4 */
function unknownNesting(query) {
  // @ts-expect-error: `nestingOperator` guaranteed.
  throw new Error('Unexpected nesting `' + query.nestingOperator + '`')
}

/**
 * Top-most scan.
 *
 * @param {Rule} query
 * @param {Node} node
 * @param {number} index
 * @param {Parent} parent
 * @param {SelectState} state
 */
function topScan(query, node, index, parent, state) {
  // Shouldn’t happen.
  /* c8 ignore next 3 */
  if (!state.iterator) {
    throw new Error('Expected `iterator`')
  }

  state.iterator(query, node, index, parent, state)
  if (!state.shallow) descendant(query, node, index, parent, state)
}

/**
 * Handle a descendant nesting operator (`a b`).
 *
 * @param {Rule} query
 * @param {Node} node
 * @param {number | undefined} index
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 */
function descendant(query, node, index, parent, state) {
  const previous = state.iterator

  state.iterator = descendantIterator
  directChild(query, node, index, parent, state)

  /** @type {SelectIterator} */
  function descendantIterator(query, node, index, parent, state) {
    // Shouldn’t happen.
    /* c8 ignore next 3 */
    if (!previous) {
      throw new Error('Expected `iterator`')
    }

    previous(query, node, index, parent, state)
    state.iterator = descendantIterator

    if (state.one && state.found) return

    directChild(query, node, index, parent, state)
  }
}

/**
 * Handle a direct child nesting operator (`a > b`).
 *
 * Also reused by normal descendant operators.
 *
 * @param {Rule} query
 * @param {Node} node
 * @param {number | undefined} _1
 * @param {Parent | undefined} _2
 * @param {SelectState} state
 */
function directChild(query, node, _1, _2, state) {
  if ('children' in node && node.children.length > 0) {
    indexedSearch(query, node, state, 0, false)
  }
}

/**
 * Handle an adjacent sibling nesting operator (`a + b`).
 *
 * @param {Rule} query
 * @param {Node} _
 * @param {number | undefined} index
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 */
function adjacentSibling(query, _, index, parent, state) {
  // Shouldn’t happen.
  /* c8 ignore next */
  if (!parent || index === undefined) return
  indexedSearch(query, parent, state, index + 1, true)
}

/**
 * Handle a general sibling nesting operator (`a ~ b`).
 *
 * @param {Rule} query
 * @param {Node} _
 * @param {number | undefined} index
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 */
function generalSibling(query, _, index, parent, state) {
  // Shouldn’t happen.
  /* c8 ignore next */
  if (!parent || index === undefined) return
  indexedSearch(query, parent, state, index + 1, false)
}

/**
 * Handles `typeIndex` and `typeCount` properties for every walker.
 *
 * @param {Rule} query
 * @param {Parent} parent
 * @param {SelectState} state
 * @param {number} from
 * @param {boolean} firstElementOnly
 */
function indexedSearch(query, parent, state, from, firstElementOnly) {
  /** Total current element count. */
  let elements = 0
  /** Total current element count by tag name. */
  /** @type {Record<string, number>} */
  const types = {}
  /** @type {Array<Function>} */
  const delayed = []
  let index = 0

  // Index elements before `from`.
  while (index < from) {
    const child = parent.children[index]

    if (child.type === 'element') {
      count(child.tagName)
    }

    index++
  }

  // Call elements at and after `from`.
  while (index < parent.children.length) {
    const child = parent.children[index]

    // Only check elements.
    // Check either all elements, or only check the first sibling
    if (child.type === 'element') {
      delay(child, index)

      // Stop if we’re looking for one node and it’s already found.
      if (state.one && state.found) return
      if (firstElementOnly) break
    }

    index++
  }

  index = -1

  while (++index < delayed.length) {
    delayed[index]()
    if (state.one && state.found) return
  }

  /**
   * @param {Element} node
   * @param {number} childIndex
   */
  function delay(node, childIndex) {
    const elementsBefore = elements
    const elementsByTypeBefore = own.call(types, node.tagName)
      ? types[node.tagName]
      : 0

    count(node.tagName)

    delayed.push(fn)

    function fn() {
      // Before counting further elements:
      state.elementIndex = elementsBefore
      state.typeIndex = elementsByTypeBefore

      // After counting all elements.
      state.elementCount = elements
      state.typeCount = types[node.tagName]

      const exit = enterState(state, node)

      // Shouldn’t happen.
      /* c8 ignore next 3 */
      if (!state.iterator) {
        throw new Error('Expected `iterator`')
      }

      state.iterator(query, node, childIndex, parent, state)
      exit()
    }
  }

  /**
   * @param {string} name
   */
  function count(name) {
    if (!own.call(types, name)) types[name] = 0
    elements++
    types[name]++
  }
}
