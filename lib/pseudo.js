/**
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').RuleSet} RuleSet
 * @typedef {import('./types.js').RulePseudo} RulePseudo
 * @typedef {import('./types.js').RulePseudoSelector} RulePseudoSelector
 * @typedef {import('./types.js').Parent} Parent
 * @typedef {import('./types.js').Selectors} Selectors
 * @typedef {import('./types.js').SelectState} SelectState
 * @typedef {import('./types.js').Root} Root
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').ElementChild} ElementChild
 */

import {extendedFilter} from 'bcp-47-match'
import {parse as commas} from 'comma-separated-tokens'
import {hasProperty} from 'hast-util-has-property'
import {isElement} from 'hast-util-is-element'
import {whitespace} from 'hast-util-whitespace'
import fauxEsmNthCheck from 'nth-check'
import {zwitch} from 'zwitch'
import {any} from './any.js'

/** @type {import('nth-check').default} */
// @ts-expect-error
const nthCheck = fauxEsmNthCheck.default || fauxEsmNthCheck

/** @type {(rule: Rule | RulePseudo, element: Element, index: number | undefined, parent: Parent | undefined, state: SelectState) => boolean} */
const handle = zwitch('name', {
  unknown: unknownPseudo,
  invalid: invalidPseudo,
  handlers: {
    any: matches,
    'any-link': anyLink,
    blank,
    checked,
    dir,
    disabled,
    empty,
    enabled,
    'first-child': firstChild,
    'first-of-type': firstOfType,
    has,
    lang,
    'last-child': lastChild,
    'last-of-type': lastOfType,
    matches,
    not,
    'nth-child': nthChild,
    'nth-last-child': nthLastChild,
    'nth-of-type': nthOfType,
    'nth-last-of-type': nthLastOfType,
    'only-child': onlyChild,
    'only-of-type': onlyOfType,
    optional,
    'read-only': readOnly,
    'read-write': readWrite,
    required,
    root,
    scope
  }
})

pseudo.needsIndex = [
  'any',
  'first-child',
  'first-of-type',
  'last-child',
  'last-of-type',
  'matches',
  'not',
  'nth-child',
  'nth-last-child',
  'nth-of-type',
  'nth-last-of-type',
  'only-child',
  'only-of-type'
]

/**
 * @param {Rule} query
 * @param {Element} element
 * @param {number | undefined} index
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
export function pseudo(query, element, index, parent, state) {
  const pseudos = query.pseudos
  let offset = -1

  while (++offset < pseudos.length) {
    if (!handle(pseudos[offset], element, index, parent, state)) return false
  }

  return true
}

/**
 * @param {RulePseudoSelector} query
 * @param {Element} element
 * @param {number | undefined} _
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
function matches(query, element, _, parent, state) {
  const {shallow, one} = state

  state.shallow = false
  state.one = true

  const result = any(query.value, element, state)[0] === element

  state.shallow = shallow
  state.one = one

  return result
}

/**
 * @param {RulePseudoSelector} query
 * @param {Element} element
 * @param {number | undefined} index
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
function not(query, element, index, parent, state) {
  return !matches(query, element, index, parent, state)
}

/**
 * @param {RulePseudo} _
 * @param {Element} element
 * @returns {boolean}
 */
function anyLink(_, element) {
  return (
    isElement(element, ['a', 'area', 'link']) && hasProperty(element, 'href')
  )
}

/**
 * @param {RulePseudo} _
 * @param {Element} element
 * @returns {boolean}
 */
function checked(_, element) {
  if (isElement(element, ['input', 'menuitem'])) {
    return Boolean(
      element.properties &&
        (element.properties.type === 'checkbox' ||
          element.properties.type === 'radio') &&
        hasProperty(element, 'checked')
    )
  }

  if (isElement(element, 'option')) {
    return hasProperty(element, 'selected')
  }

  return false
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function dir(query, _1, _2, _3, state) {
  return state.direction === query.value
}

/**
 * @param {RulePseudo} _
 * @param {Element} element
 * @returns {boolean}
 */
function disabled(_, element) {
  return (
    isElement(element, [
      'button',
      'input',
      'select',
      'textarea',
      'optgroup',
      'option',
      'menuitem',
      'fieldset'
    ]) && hasProperty(element, 'disabled')
  )
}

/**
 * @param {RulePseudo} query
 * @param {Element} element
 * @returns {boolean}
 */
function enabled(query, element) {
  return !disabled(query, element)
}

/**
 * @param {RulePseudo} _
 * @param {Element} element
 * @returns {boolean}
 */
function required(_, element) {
  return (
    isElement(element, ['input', 'textarea', 'select']) &&
    hasProperty(element, 'required')
  )
}

/**
 * @param {RulePseudo} query
 * @param {Element} element
 * @returns {boolean}
 */
function optional(query, element) {
  return !required(query, element)
}

/**
 * @param {RulePseudo} _
 * @param {Element} element
 * @param {number | undefined} _1
 * @param {Parent | undefined} _2
 * @param {SelectState} state
 * @returns {boolean}
 */
function readWrite(_, element, _1, _2, state) {
  return isElement(element, ['input', 'textarea'])
    ? !hasProperty(element, 'readOnly') && !hasProperty(element, 'disabled')
    : Boolean(state.editableOrEditingHost)
}

/**
 * @param {RulePseudo} query
 * @param {Element} element
 * @param {number | undefined} index
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
function readOnly(query, element, index, parent, state) {
  return !readWrite(query, element, index, parent, state)
}

/**
 * @param {RulePseudo} _
 * @param {Element} element
 * @param {number | undefined} _1
 * @param {Parent | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
function root(_, element, _1, parent, state) {
  return Boolean(
    (!parent || parent.type === 'root') &&
      state.schema &&
      (state.schema.space === 'html' || state.schema.space === 'svg') &&
      isElement(element, ['html', 'svg'])
  )
}

/**
 * @param {RulePseudo} _
 * @param {Element} element
 * @param {number | undefined} _1
 * @param {Parent | undefined} _2
 * @param {SelectState} state
 * @returns {boolean}
 */
function scope(_, element, _1, _2, state) {
  return Boolean(
    isElement(element) &&
      state.scopeElements &&
      state.scopeElements.includes(element)
  )
}

/**
 * @param {RulePseudo} _
 * @param {Element} element
 * @returns {boolean}
 */
function empty(_, element) {
  return !someChildren(element, check)

  /**
   * @param {ElementChild} child
   * @returns {boolean}
   */
  function check(child) {
    return child.type === 'element' || child.type === 'text'
  }
}

/**
 * @param {RulePseudo} _
 * @param {Element} element
 * @returns {boolean}
 */
function blank(_, element) {
  return !someChildren(element, check)

  /**
   * @param {ElementChild} child
   * @returns {boolean}
   */
  function check(child) {
    return (
      child.type === 'element' || (child.type === 'text' && !whitespace(child))
    )
  }
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function firstChild(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return state.elementIndex === 0
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function lang(query, _1, _2, _3, state) {
  return (
    state.language !== '' &&
    state.language !== undefined &&
    // @ts-expect-error never `selectors`.
    extendedFilter(state.language, commas(query.value)).length > 0
  )
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function lastChild(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return Boolean(
    state.elementCount && state.elementIndex === state.elementCount - 1
  )
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function onlyChild(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return state.elementCount === 1
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function nthChild(query, _1, _2, _3, state) {
  const fn = getCachedNthCheck(query)
  assertDeep(state, query)
  return typeof state.elementIndex === 'number' && fn(state.elementIndex)
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function nthLastChild(query, _1, _2, _3, state) {
  const fn = getCachedNthCheck(query)
  assertDeep(state, query)
  return Boolean(
    typeof state.elementCount === 'number' &&
      typeof state.elementIndex === 'number' &&
      fn(state.elementCount - state.elementIndex - 1)
  )
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function nthOfType(query, _1, _2, _3, state) {
  const fn = getCachedNthCheck(query)
  assertDeep(state, query)
  return typeof state.typeIndex === 'number' && fn(state.typeIndex)
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function nthLastOfType(query, _1, _2, _3, state) {
  const fn = getCachedNthCheck(query)
  assertDeep(state, query)
  return (
    typeof state.typeCount === 'number' &&
    typeof state.typeIndex === 'number' &&
    fn(state.typeCount - 1 - state.typeIndex)
  )
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function firstOfType(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return state.typeIndex === 0
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function lastOfType(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return (
    typeof state.typeIndex === 'number' &&
    typeof state.typeCount === 'number' &&
    state.typeIndex === state.typeCount - 1
  )
}

/**
 * @param {RulePseudo} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parent | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function onlyOfType(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return state.typeCount === 1
}

/**
 * @param {Element} element
 * @param {(child: ElementChild) => boolean} check
 * @returns {boolean}
 */
function someChildren(element, check) {
  const children = element.children
  let index = -1

  while (++index < children.length) {
    if (check(children[index])) return true
  }

  return false
}

// Shouldn’t be called, parser gives correct data.
/* c8 ignore next 3 */
function invalidPseudo() {
  throw new Error('Invalid pseudo-selector')
}

/**
 * @param {unknown} query
 * @returns {never}
 */
function unknownPseudo(query) {
  // @ts-expect-error: indexable.
  if (query.name) {
    // @ts-expect-error: indexable.
    throw new Error('Unknown pseudo-selector `' + query.name + '`')
  }

  throw new Error('Unexpected pseudo-element or empty pseudo-class')
}

/**
 * @param {SelectState} state
 * @param {RulePseudo} query
 */
function assertDeep(state, query) {
  if (state.shallow) {
    throw new Error('Cannot use `:' + query.name + '` without parent')
  }
}

/**
 * @param {RulePseudoSelector} query
 * @param {Element} element
 * @param {number | undefined} _1
 * @param {Parent | undefined} _2
 * @param {SelectState} state
 * @returns {boolean}
 */
function has(query, element, _1, _2, state) {
  /** @type {Root} */
  const fragment = {type: 'root', children: element.children}
  const {shallow, one, scopeElements} = state

  state.shallow = false
  state.one = true
  state.scopeElements = [element]

  const result = any(query.value, fragment, state).length > 0

  state.shallow = shallow
  state.one = one
  state.scopeElements = scopeElements

  return result
}

/**
 * @param {RulePseudo} query
 * @returns {(value: number) => boolean}
 */
function getCachedNthCheck(query) {
  /** @type {(value: number) => boolean} */
  // @ts-expect-error: cache.
  let fn = query._cachedFn

  if (!fn) {
    // @ts-expect-error: always string.
    fn = nthCheck(query.value)
    // @ts-expect-error: cache.
    query._cachedFn = fn
  }

  return fn
}
