import {extendedFilter} from 'bcp-47-match'
import {parse as commas} from 'comma-separated-tokens'
import {hasProperty} from 'hast-util-has-property'
import {isElement} from 'hast-util-is-element'
import {whitespace} from 'hast-util-whitespace'
import not from 'not'
import {zwitch} from 'zwitch'
import {any} from './any.js'

var handle = zwitch('name', {
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
    enabled: not(disabled),
    'first-child': firstChild,
    'first-of-type': firstOfType,
    has,
    lang,
    'last-child': lastChild,
    'last-of-type': lastOfType,
    matches,
    not: not(matches),
    'nth-child': nthChild,
    'nth-last-child': nthLastChild,
    'nth-of-type': nthOfType,
    'nth-last-of-type': nthLastOfType,
    'only-child': onlyChild,
    'only-of-type': onlyOfType,
    optional: not(required),
    'read-only': not(readWrite),
    'read-write': readWrite,
    required,
    root,
    scope
  }
})

pseudo.needsIndex = [
  'first-child',
  'first-of-type',
  'last-child',
  'last-of-type',
  'nth-child',
  'nth-last-child',
  'nth-of-type',
  'nth-last-of-type',
  'only-child',
  'only-of-type'
]

export function pseudo(query, node, index, parent, state) {
  var pseudos = query.pseudos
  var offset = -1

  while (++offset < pseudos.length) {
    if (!handle(pseudos[offset], node, index, parent, state)) return
  }

  return true
}

function matches(query, node, index, parent, state) {
  var shallow = state.shallow
  var one = state.one
  var result

  state.shallow = true
  state.one = true

  result = any(query.value, node, state)[0] === node

  state.shallow = shallow
  state.one = one

  return result
}

function anyLink(query, node) {
  return isElement(node, ['a', 'area', 'link']) && hasProperty(node, 'href')
}

function checked(query, node) {
  if (isElement(node, ['input', 'menuitem'])) {
    return (
      (node.properties.type === 'checkbox' ||
        node.properties.type === 'radio') &&
      hasProperty(node, 'checked')
    )
  }

  if (isElement(node, 'option')) return hasProperty(node, 'selected')
}

function dir(query, node, index, parent, state) {
  return state.direction === query.value
}

function disabled(query, node) {
  return (
    isElement(node, [
      'button',
      'input',
      'select',
      'textarea',
      'optgroup',
      'option',
      'menuitem',
      'fieldset'
    ]) && hasProperty(node, 'disabled')
  )
}

function required(query, node) {
  return (
    isElement(node, ['input', 'textarea', 'select']) &&
    hasProperty(node, 'required')
  )
}

function readWrite(query, node, index, parent, state) {
  return isElement(node, ['input', 'textarea'])
    ? !hasProperty(node, 'readOnly') && !hasProperty(node, 'disabled')
    : state.editableOrEditingHost
}

function root(query, node, index, parent, state) {
  return (
    (!parent || parent.type === 'root') &&
    (state.schema.space === 'html' || state.schema.space === 'svg') &&
    isElement(node, ['html', 'svg'])
  )
}

function scope(query, node, index, parent, state) {
  return isElement(node) && state.scopeElements.includes(node)
}

function empty(query, node) {
  return !someChildren(node, check)

  function check(child) {
    return child.type === 'element' || child.type === 'text'
  }
}

function blank(query, node) {
  return !someChildren(node, check)

  function check(child) {
    return (
      child.type === 'element' || (child.type === 'text' && !whitespace(child))
    )
  }
}

function firstChild(query, node, index, parent, state) {
  assertDeep(state, query)
  return state.elementIndex === 0
}

function lang(query, node, index, parent, state) {
  return (
    state.language !== '' &&
    state.language !== undefined &&
    state.language !== null &&
    extendedFilter(state.language, commas(query.value)).length > 0
  )
}

function lastChild(query, node, index, parent, state) {
  assertDeep(state, query)
  return state.elementIndex === state.elementCount - 1
}

function onlyChild(query, node, index, parent, state) {
  assertDeep(state, query)
  return state.elementCount === 1
}

function nthChild(query, node, index, parent, state) {
  assertDeep(state, query)
  return query.value(state.elementIndex)
}

function nthLastChild(query, node, index, parent, state) {
  assertDeep(state, query)
  return query.value(state.elementCount - state.elementIndex - 1)
}

function nthOfType(query, node, index, parent, state) {
  assertDeep(state, query)
  return query.value(state.typeIndex)
}

function nthLastOfType(query, node, index, parent, state) {
  assertDeep(state, query)
  return query.value(state.typeCount - 1 - state.typeIndex)
}

function firstOfType(query, node, index, parent, state) {
  assertDeep(state, query)
  return state.typeIndex === 0
}

function lastOfType(query, node, index, parent, state) {
  assertDeep(state, query)
  return state.typeIndex === state.typeCount - 1
}

function onlyOfType(query, node, index, parent, state) {
  assertDeep(state, query)
  return state.typeCount === 1
}

function someChildren(node, check) {
  var children = node.children
  var index = -1

  while (++index < children.length) {
    if (check(children[index])) return true
  }
}

// Shouldn’t be called, parser gives correct data.
/* c8 ignore next 3 */
function invalidPseudo() {
  throw new Error('Invalid pseudo-selector')
}

function unknownPseudo(query) {
  if (query.name) {
    throw new Error('Unknown pseudo-selector `' + query.name + '`')
  }

  throw new Error('Unexpected pseudo-element or empty pseudo-class')
}

function assertDeep(state, query) {
  if (state.shallow) {
    throw new Error('Cannot use `:' + query.name + '` without parent')
  }
}

function has(query, node, index, parent, state) {
  var shallow = state.shallow
  var one = state.one
  var scopeElements = state.scopeElements
  var value = appendScope(query.value)
  var result

  state.shallow = false
  state.one = true
  state.scopeElements = [node]

  result = any(value, node, state)[0]

  state.shallow = shallow
  state.one = one
  state.scopeElements = scopeElements

  return result
}

function appendScope(value) {
  var selector =
    value.type === 'ruleSet' ? {type: 'selectors', selectors: [value]} : value
  var index = -1
  var rule

  while (++index < selector.selectors.length) {
    rule = selector.selectors[index].rule
    rule.nestingOperator = null

    if (
      !rule.pseudos ||
      rule.pseudos.length !== 1 ||
      rule.pseudos[0].name !== 'scope'
    ) {
      selector.selectors[index] = {
        type: 'rule',
        rule,
        pseudos: [{name: 'scope'}]
      }
    }
  }

  return selector
}
