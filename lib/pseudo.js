'use strict'

module.exports = match

match.selectorPseudoSupport = ['any', 'matches', 'not']

match.needsIndex = [
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

var zwitch = require('zwitch')
var not = require('not')
var is = require('hast-util-is-element')
var has = require('hast-util-has-property')
var whitespace = require('hast-util-whitespace')
var anything = require('./any')

var handle = zwitch('name')
var handlers = handle.handlers

var disableable = [
  'button',
  'input',
  'select',
  'textarea',
  'optgroup',
  'option',
  'menuitem',
  'fieldset'
]
var linkable = ['a', 'area', 'link']
var requirable = ['input', 'textarea', 'select']

handle.unknown = unknownPseudo
handle.invalid = invalidPseudo
handlers.any = matches
handlers['any-link'] = anyLink
handlers.blank = blank
handlers.checked = checked
handlers.disabled = disabled
handlers.empty = empty
handlers.enabled = not(disabled)
handlers['first-child'] = firstChild
handlers['first-of-type'] = firstOfType
handlers['last-child'] = lastChild
handlers['last-of-type'] = lastOfType
handlers.matches = matches
handlers.not = not(matches)
handlers['nth-child'] = nthChild
handlers['nth-last-child'] = nthLastChild
handlers['nth-of-type'] = nthOfType
handlers['nth-last-of-type'] = nthLastOfType
handlers['only-child'] = onlyChild
handlers['only-of-type'] = onlyOfType
handlers.optional = not(required)
handlers.required = required

function match(query, node, index, parent, state) {
  var pseudos = query.pseudos
  var length = pseudos.length
  var offset = -1

  while (++offset < length) {
    if (!handle(pseudos[offset], node, index, parent, state)) {
      return false
    }
  }

  return true
}

function matches(query, node, index, parent, state) {
  return Boolean(anything(query.value, node, state)[0])
}

function anyLink(query, node) {
  return is(node, linkable) && has(node, 'href')
}

function checked(query, node) {
  var type = node.properties.type

  if (
    is(node, ['input', 'menuitem']) &&
    (type === 'checkbox' || type === 'radio')
  ) {
    return has(node, 'checked')
  }

  if (is(node, 'option')) {
    return has(node, 'selected')
  }

  return false
}

function disabled(query, node) {
  return is(node, disableable) && has(node, 'disabled')
}

function required(query, node) {
  return is(node, requirable) && has(node, 'required')
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
  var children = node && node.children
  var length = children && children.length
  var index = -1

  while (++index < length) {
    if (check(children[index])) {
      return true
    }
  }

  return false
}

/* istanbul ignore next - Shouldn’t be invoked, parser gives correct data. */
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
