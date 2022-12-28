/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('./types.js').Selectors} Selectors
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').RuleSet} RuleSet
 * @typedef {import('./types.js').Node} Node
 * @typedef {import('./types.js').SelectIterator} SelectIterator
 * @typedef {import('./types.js').SelectState} SelectState
 */

import {zwitch} from 'zwitch'
import {enterState} from './enter-state.js'
import {nest} from './nest.js'
import {pseudo} from './pseudo.js'
import {test} from './test.js'

/** @type {(query: Selectors | RuleSet | Rule, element: Node, state: SelectState) => Array<Element>} */
const type = zwitch('type', {
  unknown: unknownType,
  invalid: invalidType,
  handlers: {selectors, ruleSet, rule}
})

/**
 * Handle an optional query and node.
 *
 * @param {Selectors | RuleSet | Rule | undefined} query
 *   Thing to find.
 * @param {Node | undefined} node
 *   Tree.
 * @param {SelectState} state
 *   State.
 * @returns {void}
 */
export function any(query, node, state) {
  if (query && node) {
    type(query, node, state)
  }
}

/**
 * Handle selectors.
 *
 * @param {Selectors} query
 *   Multiple selectors.
 * @param {Node} node
 *   Tree.
 * @param {SelectState} state
 *   State.
 * @returns {void}
 */
function selectors(query, node, state) {
  let index = -1

  while (++index < query.selectors.length) {
    const set = query.selectors[index]
    rule(set.rule, node, state)
  }
}

/**
 * Handle a selector.
 *
 * @param {RuleSet} query
 *   One selector.
 * @param {Node} node
 *   Tree.
 * @param {SelectState} state
 *   State.
 * @returns {void}
 */
function ruleSet(query, node, state) {
  rule(query.rule, node, state)
}

/**
 * Handle a rule.
 *
 * @param {Rule} query
 *   One rule.
 * @param {Node} tree
 *   Tree.
 * @param {SelectState} state
 *   State.
 * @returns {void}
 */
function rule(query, tree, state) {
  if (state.shallow && query.rule) {
    throw new Error('Expected selector without nesting')
  }

  nest(query, tree, 0, undefined, {
    ...state,
    iterator,
    index: needsIndex(query)
  })

  /** @type {SelectIterator} */
  function iterator(query, node, index, parent, state) {
    const exit = enterState(state, node)

    if (test(query, node, index, parent, state)) {
      if (query.rule) {
        nest(query.rule, node, index, parent, {
          ...state,
          iterator,
          index: needsIndex(query.rule)
        })
      } else {
        // @ts-expect-error `test` also asserts `node is Element`
        if (!state.results.includes(node)) state.results.push(node)
        state.found = true
      }
    }

    exit()
  }
}

/**
 * Check if indexing is needed.
 *
 * @param {Rule} query
 * @returns {boolean}
 */
function needsIndex(query) {
  const pseudos = query.pseudos || []
  let index = -1

  while (++index < pseudos.length) {
    if (pseudo.needsIndex.includes(pseudos[index].name)) {
      return true
    }
  }

  return false
}

// Shouldn’t be called, all data is handled.
/**
 * @param {unknown} query
 * @returns {never}
 */
/* c8 ignore next 4 */
function unknownType(query) {
  // @ts-expect-error: `type` guaranteed.
  throw new Error('Unknown type `' + query.type + '`')
}

// Shouldn’t be called, parser gives correct data.
/* c8 ignore next 3 */
function invalidType() {
  throw new Error('Invalid type')
}
