/**
 * @typedef {import('css-selector-parser').AstSelector} AstSelector
 * @typedef {import('css-selector-parser').AstRule} AstRule
 * @typedef {import('hast').Nodes} Nodes
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('hast').Parents} Parents
 * @typedef {import('./types.js').SelectState} SelectState
 *
 * @typedef Nest
 *   Rule sets by nesting.
 * @property {Array<AstRule> | undefined} descendant
 *   `a b`
 * @property {Array<AstRule> | undefined} directChild
 *   `a > b`
 * @property {Array<AstRule> | undefined} adjacentSibling
 *   `a + b`
 * @property {Array<AstRule> | undefined} generalSibling
 *   `a ~ b`
 *
 * @typedef Counts
 *   Info on elements in a parent.
 * @property {number} count
 *   Number of elements.
 * @property {Map<string, number>} types
 *   Number of elements by tag name.
 */

import {enterState} from './enter-state.js'
import {test} from './test.js'

/** @type {Array<never>} */
const empty = []

/**
 * Walk a tree.
 *
 * @param {SelectState} state
 * @param {Nodes | undefined} tree
 */
export function walk(state, tree) {
  if (tree) {
    one(state, [], tree, undefined, undefined)
  }
}

/**
 * Check a node.
 *
 * @param {SelectState} state
 * @param {Array<AstRule>} currentRules
 * @param {Nodes} node
 * @param {number | undefined} index
 * @param {Parents | undefined} parent
 * @returns {Nest}
 */
function one(state, currentRules, node, index, parent) {
  /** @type {Nest} */
  let nestResult = {
    directChild: undefined,
    descendant: undefined,
    adjacentSibling: undefined,
    generalSibling: undefined
  }

  const exit = enterState(state, node)

  if (node.type === 'element') {
    nestResult = applySelectors(
      state,
      // Try the root rules for this element too.
      combine(currentRules, state.rootQuery.rules),
      node,
      index,
      parent
    )
  }

  // If this is a parent, and we want to delve into them, and we haven’t found
  // our single result yet.
  if ('children' in node && !state.shallow && !(state.one && state.found)) {
    all(state, nestResult, node)
  }

  exit()

  return nestResult
}

/**
 * Check a node.
 *
 * @param {SelectState} state
 * @param {Nest} nest
 * @param {Parents} node
 * @returns {void}
 */
function all(state, nest, node) {
  const fromParent = combine(nest.descendant, nest.directChild)
  /** @type {Array<AstRule> | undefined} */
  let fromSibling
  let index = -1
  /**
   * Total counts.
   * @type {Counts}
   */
  const total = {count: 0, types: new Map()}
  /**
   * Counts of previous siblings.
   * @type {Counts}
   */
  const before = {count: 0, types: new Map()}

  while (++index < node.children.length) {
    count(total, node.children[index])
  }

  index = -1

  while (++index < node.children.length) {
    const child = node.children[index]
    // Uppercase to prevent prototype polution, injecting `constructor` or so.
    // Normalize because HTML is insensitive.
    const name =
      child.type === 'element' ? child.tagName.toUpperCase() : undefined
    // Before counting further elements:
    state.elementIndex = before.count
    state.typeIndex = name ? before.types.get(name) || 0 : 0
    // After counting all elements.
    state.elementCount = total.count
    state.typeCount = name ? total.types.get(name) : 0

    // Only apply if this is a parent, this should be an element, but we check
    // for parents so that we delve into custom nodes too.
    if ('children' in child) {
      const forSibling = combine(fromParent, fromSibling)
      const nest = one(state, forSibling, node.children[index], index, node)
      fromSibling = combine(nest.generalSibling, nest.adjacentSibling)
    }

    // We found one thing, and one is enough.
    if (state.one && state.found) {
      break
    }

    count(before, node.children[index])
  }
}

/**
 * Apply selectors to an element.
 *
 * @param {SelectState} state
 *   Current state.
 * @param {Array<AstRule>} rules
 *   Rules to apply.
 * @param {Element} node
 *   Element to apply rules to.
 * @param {number | undefined} index
 *   Index of node in parent.
 * @param {Parents | undefined} parent
 *   Parent of node.
 * @returns {Nest}
 *   Further rules.
 */
function applySelectors(state, rules, node, index, parent) {
  /** @type {Nest} */
  const nestResult = {
    directChild: undefined,
    descendant: undefined,
    adjacentSibling: undefined,
    generalSibling: undefined
  }
  let selectorIndex = -1

  while (++selectorIndex < rules.length) {
    const rule = rules[selectorIndex]

    // We found one thing, and one is enough.
    if (state.one && state.found) {
      break
    }

    // When shallow, we don’t allow nested rules.
    // Idea: we could allow a stack of parents?
    // Might get quite complex though.
    if (state.shallow && rule.nestedRule) {
      throw new Error('Expected selector without nesting')
    }

    // If this rule matches:
    if (test(rule, node, index, parent, state)) {
      const nest = rule.nestedRule

      // Are there more?
      if (nest) {
        /** @type {keyof Nest} */
        const label =
          nest.combinator === '+'
            ? 'adjacentSibling'
            : nest.combinator === '~'
            ? 'generalSibling'
            : nest.combinator === '>'
            ? 'directChild'
            : 'descendant'
        add(nestResult, label, nest)
      } else {
        // We have a match!
        state.found = true

        if (!state.results.includes(node)) {
          state.results.push(node)
        }
      }
    }

    // Descendant.
    if (rule.combinator === undefined) {
      add(nestResult, 'descendant', rule)
    }
    // Adjacent.
    else if (rule.combinator === '~') {
      add(nestResult, 'generalSibling', rule)
    }
    // Drop direct child (`>`), adjacent sibling (`+`).
  }

  return nestResult
}

/**
 * Combine two lists, if needed.
 *
 * This is optimized to create as few lists as possible.
 *
 * @param {Array<AstRule> | undefined} left
 * @param {Array<AstRule> | undefined} right
 * @returns {Array<AstRule>}
 */
function combine(left, right) {
  return left && right && left.length > 0 && right.length > 0
    ? [...left, ...right]
    : left && left.length > 0
    ? left
    : right && right.length > 0
    ? right
    : empty
}

/**
 * Add a rule to a nesting map.
 *
 * @param {Nest} nest
 * @param {keyof Nest} field
 * @param {AstRule} rule
 */
function add(nest, field, rule) {
  const list = nest[field]
  if (list) {
    list.push(rule)
  } else {
    nest[field] = [rule]
  }
}

/**
 * Count a node.
 *
 * @param {Counts} counts
 *   Counts.
 * @param {Nodes} node
 *   Node (we’re looking for elements).
 * @returns {void}
 *   Nothing.
 */
function count(counts, node) {
  if (node.type === 'element') {
    // Uppercase to prevent prototype polution, injecting `constructor` or so.
    // Normalize because HTML is insensitive.
    const name = node.tagName.toUpperCase()
    const count = (counts.types.get(name) || 0) + 1
    counts.count++
    counts.types.set(name, count)
  }
}
