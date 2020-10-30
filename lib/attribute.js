'use strict'

module.exports = match

var commas = require('comma-separated-tokens')
var has = require('hast-util-has-property')
var find = require('property-information/find')
var spaces = require('space-separated-tokens')
var zwitch = require('zwitch')

var handle = zwitch('operator', {
  unknown: unknownOperator,
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

function match(query, node, schema) {
  var attrs = query.attrs
  var index = -1

  while (++index < attrs.length) {
    if (!handle(attrs[index], node, find(schema, attrs[index].name))) return
  }

  return true
}

// `[attr]`
function exists(query, node, info) {
  return has(node, info.property)
}

// `[attr=value]`
function exact(query, node, info) {
  return (
    has(node, info.property) &&
    normalizeValue(node.properties[info.property], info) === query.value
  )
}

// `[attr~=value]`
function spaceSeparatedList(query, node, info) {
  var value = node.properties[info.property]

  return (
    // If this is a comma-separated list, and the query is contained in it, return
    // true.
    (!info.commaSeparated &&
      value &&
      typeof value === 'object' &&
      value.indexOf(query.value) > -1) ||
    // For all other values (including comma-separated lists), return whether this
    // is an exact match.
    (has(node, info.property) && normalizeValue(value, info) === query.value)
  )
}

// `[attr|=value]`
function exactOrPrefix(query, node, info) {
  var value = normalizeValue(node.properties[info.property], info)

  return (
    has(node, info.property) &&
    (value === query.value ||
      (value.slice(0, query.value.length) === query.value &&
        value.charAt(query.value.length) === '-'))
  )
}

// `[attr^=value]`
function begins(query, node, info) {
  return (
    has(node, info.property) &&
    normalizeValue(node.properties[info.property], info).slice(
      0,
      query.value.length
    ) === query.value
  )
}

// `[attr$=value]`
function ends(query, node, info) {
  return (
    has(node, info.property) &&
    normalizeValue(node.properties[info.property], info).slice(
      -query.value.length
    ) === query.value
  )
}

// `[attr*=value]`
function contains(query, node, info) {
  return (
    has(node, info.property) &&
    normalizeValue(node.properties[info.property], info).indexOf(query.value) >
      -1
  )
}

/* istanbul ignore next - Shouldn’t be invoked, Parser throws an error instead. */
function unknownOperator(query) {
  throw new Error('Unknown operator `' + query.operator + '`')
}

// Stringify a hast value back to its HTML form.
function normalizeValue(value, info) {
  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return info.attribute
  }

  if (typeof value === 'object' && 'length' in value) {
    return (info.commaSeparated ? commas.stringify : spaces.stringify)(value)
  }

  return value
}
