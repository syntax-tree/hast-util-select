/**
 * @typedef {import('css-selector-parser').AstRule} AstRule
 * @typedef {import('css-selector-parser').AstPseudoClass} AstPseudoClass
 * @typedef {import('hast').Parents} Parents
 * @typedef {import('./types.js').SelectState} SelectState
 * @typedef {import('./types.js').Element} Element
 * @typedef {import('./types.js').ElementChild} ElementChild
 */

import {extendedFilter} from 'bcp-47-match'
import {parse as commas} from 'comma-separated-tokens'
import {ok as assert, unreachable} from 'devlop'
import {hasProperty} from 'hast-util-has-property'
import {whitespace} from 'hast-util-whitespace'
import fauxEsmNthCheck from 'nth-check'
import {zwitch} from 'zwitch'
import {walk} from './walk.js'

/** @type {import('nth-check').default} */
// @ts-expect-error
const nthCheck = fauxEsmNthCheck.default || fauxEsmNthCheck

/** @type {(rule: AstRule | AstPseudoClass, element: Element, index: number | undefined, parent: Parents | undefined, state: SelectState) => boolean} */
const handle = zwitch('name', {
  unknown: unknownPseudo,
  invalid: invalidPseudo,
  handlers: {
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
    is,
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
  'is',
  'last-child',
  'last-of-type',
  'not',
  'nth-child',
  'nth-last-child',
  'nth-of-type',
  'nth-last-of-type',
  'only-child',
  'only-of-type'
]

/**
 * Check whether an element matches pseudo selectors.
 *
 * @param {AstRule} query
 * @param {Element} element
 * @param {number | undefined} index
 * @param {Parents | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
export function pseudo(query, element, index, parent, state) {
  const pseudos = query.pseudoClasses
  assert(pseudos, 'expected `pseudoClasses`')
  let offset = -1

  while (++offset < pseudos.length) {
    if (!handle(pseudos[offset], element, index, parent, state)) return false
  }

  return true
}

/**
 * Check whether an element matches an `:any-link` pseudo.
 *
 * @param {AstPseudoClass} _
 * @param {Element} element
 * @returns {boolean}
 */
function anyLink(_, element) {
  return (
    (element.tagName === 'a' ||
      element.tagName === 'area' ||
      element.tagName === 'link') &&
    hasProperty(element, 'href')
  )
}

/**
 * Check whether an element matches a `:blank` pseudo.
 *
 * @param {AstPseudoClass} _
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
 * Check whether an element matches a `:checked` pseudo.
 *
 * @param {AstPseudoClass} _
 * @param {Element} element
 * @returns {boolean}
 */
function checked(_, element) {
  if (element.tagName === 'input' || element.tagName === 'menuitem') {
    return Boolean(
      element.properties &&
        (element.properties.type === 'checkbox' ||
          element.properties.type === 'radio') &&
        hasProperty(element, 'checked')
    )
  }

  if (element.tagName === 'option') {
    return hasProperty(element, 'selected')
  }

  return false
}

/**
 * Check whether an element matches a `:dir()` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function dir(query, _1, _2, _3, state) {
  assert(query.argument, 'expected `argument`')
  assert(query.argument.type === 'String', 'expected plain text')
  return state.direction === query.argument.value
}

/**
 * Check whether an element matches a `:disabled` pseudo.
 *
 * @param {AstPseudoClass} _
 * @param {Element} element
 * @returns {boolean}
 */
function disabled(_, element) {
  return (
    (element.tagName === 'button' ||
      element.tagName === 'input' ||
      element.tagName === 'select' ||
      element.tagName === 'textarea' ||
      element.tagName === 'optgroup' ||
      element.tagName === 'option' ||
      element.tagName === 'menuitem' ||
      element.tagName === 'fieldset') &&
    hasProperty(element, 'disabled')
  )
}

/**
 * Check whether an element matches an `:empty` pseudo.
 *
 * @param {AstPseudoClass} _
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
 * Check whether an element matches an `:enabled` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} element
 * @returns {boolean}
 */
function enabled(query, element) {
  return !disabled(query, element)
}

/**
 * Check whether an element matches a `:first-child` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function firstChild(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return state.elementIndex === 0
}

/**
 * Check whether an element matches a `:first-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function firstOfType(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return state.typeIndex === 0
}

/**
 * @param {AstPseudoClass} query
 * @param {Element} element
 * @param {number | undefined} _1
 * @param {Parents | undefined} _2
 * @param {SelectState} state
 * @returns {boolean}
 */
function has(query, element, _1, _2, state) {
  assert(query.argument, 'expected `argument`')
  assert(query.argument.type === 'Selector', 'expected selector')

  /** @type {SelectState} */
  const childState = {
    ...state,
    // Not found yet.
    found: false,
    // Do walk deep.
    shallow: false,
    // One result is enough.
    one: true,
    scopeElements: [element],
    results: [],
    rootQuery: query.argument
  }

  walk(childState, {type: 'root', children: element.children})

  return childState.results.length > 0
}

/**
 * Check whether an element matches a `:lang()` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function lang(query, _1, _2, _3, state) {
  assert(query.argument, 'expected `argument`')
  assert(query.argument.type === 'String', 'expected string')

  return (
    state.language !== '' &&
    state.language !== undefined &&
    extendedFilter(state.language, commas(query.argument.value)).length > 0
  )
}

/**
 * Check whether an element matches a `:last-child` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
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
 * Check whether an element matches a `:last-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
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
 * Check whether an element `:is` further selectors.
 *
 * @param {AstPseudoClass} query
 * @param {Element} element
 * @param {number | undefined} _
 * @param {Parents | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
function is(query, element, _, parent, state) {
  assert(query.argument, 'expected `argument`')
  assert(query.argument.type === 'Selector', 'expected selector')

  /** @type {SelectState} */
  const childState = {
    ...state,
    // Not found yet.
    found: false,
    // Do walk deep.
    shallow: false,
    // One result is enough.
    one: true,
    scopeElements: [element],
    results: [],
    rootQuery: query.argument
  }

  walk(childState, element)

  return childState.results[0] === element
}

/**
 * Check whether an element does `:not` match further selectors.
 *
 * @param {AstPseudoClass} query
 * @param {Element} element
 * @param {number | undefined} index
 * @param {Parents | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
function not(query, element, index, parent, state) {
  return !is(query, element, index, parent, state)
}

/**
 * Check whether an element matches an `:nth-child` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function nthChild(query, _1, _2, _3, state) {
  const fn = getCachedNthCheck(query)
  assertDeep(state, query)
  return typeof state.elementIndex === 'number' && fn(state.elementIndex)
}

/**
 * Check whether an element matches an `:nth-last-child` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
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
 * Check whether an element matches a `:nth-last-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
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
 * Check whether an element matches an `:nth-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function nthOfType(query, _1, _2, _3, state) {
  const fn = getCachedNthCheck(query)
  assertDeep(state, query)
  return typeof state.typeIndex === 'number' && fn(state.typeIndex)
}

/**
 * Check whether an element matches an `:only-child` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function onlyChild(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return state.elementCount === 1
}

/**
 * Check whether an element matches an `:only-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} _1
 * @param {number | undefined} _2
 * @param {Parents | undefined} _3
 * @param {SelectState} state
 * @returns {boolean}
 */
function onlyOfType(query, _1, _2, _3, state) {
  assertDeep(state, query)
  return state.typeCount === 1
}

/**
 * Check whether an element matches an `:optional` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} element
 * @returns {boolean}
 */
function optional(query, element) {
  return !required(query, element)
}

/**
 * Check whether an element matches a `:read-only` pseudo.
 *
 * @param {AstPseudoClass} query
 * @param {Element} element
 * @param {number | undefined} index
 * @param {Parents | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
function readOnly(query, element, index, parent, state) {
  return !readWrite(query, element, index, parent, state)
}

/**
 * Check whether an element matches a `:read-write` pseudo.
 *
 * @param {AstPseudoClass} _
 * @param {Element} element
 * @param {number | undefined} _1
 * @param {Parents | undefined} _2
 * @param {SelectState} state
 * @returns {boolean}
 */
function readWrite(_, element, _1, _2, state) {
  return element.tagName === 'input' || element.tagName === 'textarea'
    ? !hasProperty(element, 'readOnly') && !hasProperty(element, 'disabled')
    : Boolean(state.editableOrEditingHost)
}

/**
 * Check whether an element matches a `:required` pseudo.
 *
 * @param {AstPseudoClass} _
 * @param {Element} element
 * @returns {boolean}
 */
function required(_, element) {
  return (
    (element.tagName === 'input' ||
      element.tagName === 'textarea' ||
      element.tagName === 'select') &&
    hasProperty(element, 'required')
  )
}

/**
 * Check whether an element matches a `:root` pseudo.
 *
 * @param {AstPseudoClass} _
 * @param {Element} element
 * @param {number | undefined} _1
 * @param {Parents | undefined} parent
 * @param {SelectState} state
 * @returns {boolean}
 */
function root(_, element, _1, parent, state) {
  return Boolean(
    (!parent || parent.type === 'root') &&
      state.schema &&
      (state.schema.space === 'html' || state.schema.space === 'svg') &&
      (element.tagName === 'html' || element.tagName === 'svg')
  )
}

/**
 * Check whether an element matches a `:scope` pseudo.
 *
 * @param {AstPseudoClass} _
 * @param {Element} element
 * @param {number | undefined} _1
 * @param {Parents | undefined} _2
 * @param {SelectState} state
 * @returns {boolean}
 */
function scope(_, element, _1, _2, state) {
  return state.scopeElements.includes(element)
}

// Shouldn’t be called, parser gives correct data.
/* c8 ignore next 3 */
function invalidPseudo() {
  throw new Error('Invalid pseudo-selector')
}

/**
 * @param {unknown} query_
 * @returns {never}
 */
function unknownPseudo(query_) {
  // Runtime JS guarantees it has a `name`.
  const query = /** @type {AstPseudoClass} */ (query_)
  throw new Error('Unknown pseudo-selector `' + query.name + '`')
}

/**
 * Check children.
 *
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

/**
 * @param {SelectState} state
 * @param {AstPseudoClass} query
 */
function assertDeep(state, query) {
  if (state.shallow) {
    throw new Error('Cannot use `:' + query.name + '` without parent')
  }
}

/**
 * @param {AstPseudoClass} query
 * @returns {(value: number) => boolean}
 */
function getCachedNthCheck(query) {
  /** @type {(value: number) => boolean} */
  // @ts-expect-error: cache.
  let fn = query._cachedFn

  if (!fn) {
    const value = query.argument

    /* c8 ignore next 3 -- never happens with our config */
    if (!value || value.type !== 'Formula') {
      unreachable('`:nth` has a formula')
    }

    fn = nthCheck(value.a + 'n+' + value.b)
    // @ts-expect-error: cache.
    query._cachedFn = fn
  }

  return fn
}
