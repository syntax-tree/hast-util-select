/**
 * @typedef {import('css-selector-parser').AstAttribute} AstAttribute
 * @typedef {import('css-selector-parser').AstRule} AstRule
 *
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Properties} Properties
 *
 * @typedef {import('property-information').Info} Info
 * @typedef {import('property-information').Schema} Schema
 */

import {stringify as commas} from 'comma-separated-tokens'
import {ok as assert, unreachable} from 'devlop'
import {hasProperty} from 'hast-util-has-property'
import {find} from 'property-information'
import {stringify as spaces} from 'space-separated-tokens'
import {zwitch} from 'zwitch'

/** @type {(query: AstAttribute, element: Element, info: Info) => boolean} */
const handle = zwitch('operator', {
  unknown: unknownOperator,
  // @ts-expect-error: `exists` is fine.
  invalid: exists,
  handlers: {
    '=': exact,
    '$=': ends,
    '*=': contains,
    '^=': begins,
    '|=': exactOrPrefix,
    '~=': spaceSeparatedList
  }
})

/**
 * @param {AstRule} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Schema} schema
 *   Schema of element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
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
 * Check whether an attribute has a substring as its start.
 *
 * `[attr^=value]`
 *
 * @param {AstAttribute} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Info} info
 *   Property info.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function begins(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  return Boolean(
    hasProperty(element, info.property) &&
      normalizeValue(element.properties[info.property], info).slice(
        0,
        query.value.value.length
      ) === query.value.value
  )
}

/**
 * Check whether an attribute contains a substring.
 *
 * `[attr*=value]`
 *
 * @param {AstAttribute} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Info} info
 *   Property info.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function contains(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  return Boolean(
    hasProperty(element, info.property) &&
      normalizeValue(element.properties[info.property], info).includes(
        query.value.value
      )
  )
}

/**
 * Check whether an attribute has a substring as its end.
 *
 * `[attr$=value]`
 *
 * @param {AstAttribute} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Info} info
 *   Property info.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function ends(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  return Boolean(
    hasProperty(element, info.property) &&
      normalizeValue(element.properties[info.property], info).slice(
        -query.value.value.length
      ) === query.value.value
  )
}

/**
 * Check whether an attribute has an exact value.
 *
 * `[attr=value]`
 *
 * @param {AstAttribute} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Info} info
 *   Property info.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function exact(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  return Boolean(
    hasProperty(element, info.property) &&
      normalizeValue(element.properties[info.property], info) ===
        query.value.value
  )
}

/**
 * Check whether an attribute has a substring as either the exact value or a
 * prefix.
 *
 * `[attr|=value]`
 *
 * @param {AstAttribute} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Info} info
 *   Property info.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function exactOrPrefix(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  const value = normalizeValue(element.properties[info.property], info)

  return Boolean(
    hasProperty(element, info.property) &&
      (value === query.value.value ||
        (value.slice(0, query.value.value.length) === query.value.value &&
          value.charAt(query.value.value.length) === '-'))
  )
}

/**
 * Check whether an attribute exists.
 *
 * `[attr]`
 *
 * @param {AstAttribute} _
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Info} info
 *   Property info.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function exists(_, element, info) {
  return hasProperty(element, info.property)
}

/**
 * Stringify a hast value back to its HTML form.
 *
 * @param {Properties[keyof Properties]} value
 *   hast property value.
 * @param {Info} info
 *   Property info.
 * @returns {string}
 *   Normalized value.
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

/**
 * Check whether an attribute, interpreted as a space-separated list, contains
 * a value.
 *
 * `[attr~=value]`
 *
 * @param {AstAttribute} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Info} info
 *   Property info.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function spaceSeparatedList(query, element, info) {
  assert(query.value, 'expected `value`')
  assert(query.value.type === 'String', 'expected plain string')

  const value = element.properties[info.property]

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

// Shouldn’t be called, Parser throws an error instead.
/**
 * @param {unknown} query_
 *   Query.
 * @returns {never}
 *   Nothing.
 * @throws {Error}
 *   Error.
 */
/* c8 ignore next 5 */
function unknownOperator(query_) {
  // Runtime guarantees `operator` exists.
  const query = /** @type {AstAttribute} */ (query_)
  unreachable('Unknown operator `' + query.operator + '`')
}
