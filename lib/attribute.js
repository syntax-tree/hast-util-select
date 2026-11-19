/**
 * @import {AstAttribute} from 'css-selector-parser'
 * @import {Element, Properties} from 'hast'
 * @import {Info, Schema} from 'property-information'
 */

import {stringify as commas} from 'comma-separated-tokens'
import {ok as assert} from 'devlop'
import {find} from 'property-information'
import * as spaces from 'space-separated-tokens'

/**
 * Check whether an element matches an attribute selector.
 *
 * @param {AstAttribute} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Schema} schema
 *   Schema of element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function attribute(query, element, schema) {
  const info = find(schema, query.name)
  const value = element.properties[info.property]

  if (value === true) {
    return matchValue(query, '') || matchValue(query, info.attribute)
  }

  return matchValue(query, normalizeValue(value, info))
}

/**
 * Check whether a value matches an attribute selector.
 *
 * @param {AstAttribute} query
 *   Query.
 * @param {string | undefined} value
 *   Serialized value, `undefined` if the attribute does not exist.
 * @returns {boolean}
 *   Whether `value` matches `query`.
 */
function matchValue(query, value) {
  // Exists.
  if (!query.value) {
    return value !== undefined
  }

  assert(query.value.type === 'String', 'expected plain string')
  let key = query.value.value

  // Case-sensitivity.
  if (query.caseSensitivityModifier === 'i') {
    key = key.toLowerCase()

    if (value) {
      value = value.toLowerCase()
    }
  }

  if (value !== undefined) {
    switch (query.operator) {
      // Exact.
      case '=': {
        return key === value
      }

      // Ends.
      case '$=': {
        return key !== '' && value.endsWith(key)
      }

      // Contains.
      case '*=': {
        return key !== '' && value.includes(key)
      }

      // Begins.
      case '^=': {
        return key !== '' && value.startsWith(key)
      }

      // Exact or prefix.
      case '|=': {
        return (
          key === value ||
          (key === value.slice(0, key.length) &&
            value.charAt(key.length) === '-')
        )
      }

      // Space-separated list.
      case '~=': {
        return spaces.parse(value).includes(key)
      }
      // Other values are not yet supported by CSS.
      // No default
    }
  }

  return false
}

/**
 * Serialize a property value.
 *
 * @param {Properties[keyof Properties]} value
 *   Value.
 * @param {Info} info
 *   Property info.
 * @returns {string | undefined}
 *   Serialized value.
 */
function normalizeValue(value, info) {
  // True is already handled above.
  if (value === null || value === undefined || value === false) {
    // Empty.
  } else if (Array.isArray(value)) {
    return (info.commaSeparated ? commas : spaces.stringify)(value)
  } else {
    return String(value)
  }
}
