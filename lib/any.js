/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('./types.js').Selectors} Selectors
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').RuleSet} RuleSet
 * @typedef {import('./types.js').HastNode} HastNode
 * @typedef {import('./types.js').SelectIterator} SelectIterator
 * @typedef {import('./types.js').SelectState} SelectState
 */

import {html, svg} from 'property-information'
import {zwitch} from 'zwitch'
import {enterState} from './enter-state.js'
import {nest} from './nest.js'
import {pseudo} from './pseudo.js'
import {test} from './test.js'

var type = zwitch('type', {
  unknown: unknownType,
  invalid: invalidType,
  handlers: {selectors, ruleSet, rule}
})

/**
 * @param {Selectors|RuleSet|Rule} query
 * @param {HastNode} node
 * @param {SelectState} state
 * @returns {Array.<Element>}
 */
export function any(query, node, state) {
  // @ts-ignore zwitch types are off.
  return query && node ? type(query, node, state) : []
}

/**
 * @param {Selectors} query
 * @param {HastNode} node
 * @param {SelectState} state
 * @returns {Array.<Element>}
 */
function selectors(query, node, state) {
  var collector = new Collector(state.one)
  var index = -1

  while (++index < query.selectors.length) {
    collector.collectAll(ruleSet(query.selectors[index], node, state))
  }

  return collector.result
}

/**
 * @param {RuleSet} query
 * @param {HastNode} node
 * @param {SelectState} state
 * @returns {Array.<Element>}
 */
function ruleSet(query, node, state) {
  return rule(query.rule, node, state)
}

/**
 * @param {Rule} query
 * @param {HastNode} tree
 * @param {SelectState} state
 * @returns {Array.<Element>}
 */
function rule(query, tree, state) {
  var collector = new Collector(state.one)

  if (state.shallow && query.rule) {
    throw new Error('Expected selector without nesting')
  }

  nest(
    query,
    tree,
    0,
    null,
    configure(query, {
      schema: state.space === 'svg' ? svg : html,
      language: null,
      direction: 'ltr',
      editableOrEditingHost: false,
      // @ts-ignore assume elements.
      scopeElements: tree.type === 'root' ? tree.children : [tree],
      iterator,
      one: state.one,
      shallow: state.shallow
    })
  )

  return collector.result

  /** @type {SelectIterator} */
  function iterator(query, node, index, parent, state) {
    var exit = enterState(state, node)

    if (test(query, node, index, parent, state)) {
      if (query.rule) {
        nest(query.rule, node, index, parent, configure(query.rule, state))
      } else {
        // @ts-ignore `test` also asserts `node is Element`
        collector.collect(node)
        state.found = true
      }
    }

    exit()
  }

  /**
   * @template {SelectState} S
   * @param {Rule} query
   * @param {S} state
   * @returns {S}
   */
  function configure(query, state) {
    var pseudos = query.pseudos || []
    var index = -1

    while (++index < pseudos.length) {
      if (pseudo.needsIndex.includes(pseudos[index].name)) {
        state.index = true
        break
      }
    }

    return state
  }
}

// Shouldn’t be called, all data is handled.
/* c8 ignore next 6 */
/**
 * @param {{[x: string]: unknown, type: string}} query
 */
function unknownType(query) {
  throw new Error('Unknown type `' + query.type + '`')
}

// Shouldn’t be called, parser gives correct data.
/* c8 ignore next 3 */
function invalidType() {
  throw new Error('Invalid type')
}

class Collector {
  /**
   * @param {boolean} one
   */
  constructor(one) {
    /** @type {Array.<Element>} */
    this.result = []
    /** @type {boolean} */
    this.one = one
    /** @type {boolean} */
    this.found = false
  }

  /**
   * Append nodes to array, filtering out duplicates.
   *
   * @param {Array.<Element>} elements
   */
  collectAll(elements) {
    var index = -1

    while (++index < elements.length) {
      this.collect(elements[index])
    }
  }

  /**
   * Append one node.
   *
   * @param {Element} element
   */
  collect(element) {
    if (this.one) {
      // Shouldn’t happen, safeguards performance problems.
      /* c8 ignore next */
      if (this.found) throw new Error('Cannot collect multiple nodes')
      this.found = true
    }

    if (!this.result.includes(element)) this.result.push(element)
  }
}
