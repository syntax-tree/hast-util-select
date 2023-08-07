/**
 * @typedef {import('css-selector-parser').AstRule} AstRule
 * @typedef {import('css-selector-parser').AstAttribute} AstAttribute
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('property-information').Schema} Schema
 * @typedef {import('property-information').Info} Info
 */

import {stringify as commas} from 'comma-separated-tokens'
import {ok as assert} from 'devlop'
import {hasProperty} from 'hast-util-has-property'
import {find} from 'property-information'
import {stringify as spaces} from 'space-separated-tokens'
import {zwitch} from 'zwitch'

/** @type {(query: AstAttribute, element: Element, info: Info) => boolean} */
const handle = zwitch('operator', {
  unknown: unknownOperator,
  // @ts-expect-error: hush.
  invalid: exists,
  handlers: {
    '=': exact,
    '~=': spaceSeparatedList,
    '|=': exactOrPrefix,
    '^=': begins,
    '$=': ends,
    '*=': contains
  }
})

/**
 * @param {AstRule} query
 * @param {Element} element
 * @param {Schema} schema
 * @returns {boolean}
 */
export function attribute(query, element, schema) {
  let index = -1

  if (query.attributes) {
    while (++index < query.attributes.length) {
      const attribute = query.attributes[index]

      if (!handle(attribute, element, find(schema, attribute.name))) {
        return false
      }
    }
  }

  return true
}

/**
 * Check whether an attribute exists.
 *
 * `[attr]`
 *
 * @param {AstAttribute} _
 * @param {Element} element
 * @param {Info} info
 * @returns {boolean}
 */
function exists(_, element, info) {
  return hasProperty(element, info.property)
}

/**
 * Check whether an attribute has an exact value.
 *
 * `[attr=value]`
 *
 * @param {AstAttribute} query
 * @param {Element} element
 * @param {Info} info
 * @returns {boolean}
 */
function exact(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  return Boolean(
    hasProperty(element, info.property) &&
      element.properties &&
      normalizeValue(element.properties[info.property], info) ===
        query.value.value
  )
}

/**
 * Check whether an attribute, interpreted as a space-separated list, contains
 * a value.
 *
 * `[attr~=value]`
 *
 * @param {AstAttribute} query
 * @param {Element} element
 * @param {Info} info
 * @returns {boolean}
 */
function spaceSeparatedList(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  const value = element.properties && element.properties[info.property]

  return (
    // If this is a space-separated list, and the query is contained in it, return
    // true.
    (!info.commaSeparated &&
      value &&
      typeof value === 'object' &&
      value.includes(query.value.value)) ||
    // For all other values (including comma-separated lists), return whether this
    // is an exact match.
    (hasProperty(element, info.property) &&
      normalizeValue(value, info) === query.value.value)
  )
}

/**
 * Check whether an attribute has a substring as either the exact value or a
 * prefix.
 *
 * `[attr|=value]`
 *
 * @param {AstAttribute} query
 * @param {Element} element
 * @param {Info} info
 * @returns {boolean}
 */
function exactOrPrefix(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  const value = normalizeValue(
    element.properties && element.properties[info.property],
    info
  )

  return Boolean(
    hasProperty(element, info.property) &&
      (value === query.value.value ||
        (value.slice(0, query.value.value.length) === query.value.value &&
          value.charAt(query.value.value.length) === '-'))
  )
}

/**
 * Check whether an attribute has a substring as its start.
 *
 * `[attr^=value]`
 *
 * @param {AstAttribute} query
 * @param {Element} element
 * @param {Info} info
 * @returns {boolean}
 */
function begins(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  return Boolean(
    hasProperty(element, info.property) &&
      element.properties &&
      normalizeValue(element.properties[info.property], info).slice(
        0,
        query.value.value.length
      ) === query.value.value
  )
}

/**
 * Check whether an attribute has a substring as its end.
 *
 * `[attr$=value]`
 *
 * @param {AstAttribute} query
 * @param {Element} element
 * @param {Info} info
 * @returns {boolean}
 */
function ends(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  return Boolean(
    hasProperty(element, info.property) &&
      element.properties &&
      normalizeValue(element.properties[info.property], info).slice(
        -query.value.value.length
      ) === query.value.value
  )
}

/**
 * Check whether an attribute contains a substring.
 *
 * `[attr*=value]`
 *
 * @param {AstAttribute} query
 * @param {Element} element
 * @param {Info} info
 * @returns {boolean}
 */
function contains(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  return Boolean(
    hasProperty(element, info.property) &&
      element.properties &&
      normalizeValue(element.properties[info.property], info).includes(
        query.value.value
      )
  )
}

// Shouldn’t be called, Parser throws an error instead.
/**
 * @param {unknown} query
 * @returns {never}
 */
/* c8 ignore next 4 */
function unknownOperator(query) {
  // @ts-expect-error: `operator` guaranteed.
  throw new Error('Unknown operator `' + query.operator + '`')
}

/**
 * Stringify a hast value back to its HTML form.
 *
 * @param {Properties[keyof Properties]} value
 * @param {Info} info
 * @returns {string}
 */
function normalizeValue(value, info) {
  if (typeof value === 'boolean') {
    return info.attribute
  }

  if (Array.isArray(value)) {
    return (info.commaSeparated ? commas : spaces)(value)
  }

  return String(value)
}
