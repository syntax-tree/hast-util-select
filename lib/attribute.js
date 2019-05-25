'use strict'

module.exports = match

var zwitch = require('zwitch')
var has = require('hast-util-has-property')
var find = require('property-information/find')
var spaceSeparated = require('space-separated-tokens').stringify
var commaSeparated = require('comma-separated-tokens').stringify

var handle = zwitch('operator')
var handlers = handle.handlers

handle.unknown = unknownOperator
handle.invalid = exists
handlers['='] = exact
handlers['~='] = spaceSeparatedList
handlers['|='] = exactOrPrefix
handlers['^='] = begins
handlers['$='] = ends
handlers['*='] = contains

function match(query, node, schema) {
  var attrs = query.attrs
  var length = attrs.length
  var index = -1
  var info
  var attr

  while (++index < length) {
    attr = attrs[index]
    info = find(schema, attr.name)

    if (!handle(attr, node, info)) {
      return false
    }
  }

  return true
}

// `[attr]`
function exists(query, node, info) {
  return has(node, info.property)
}

// `[attr=value]`
function exact(query, node, info) {
  if (!has(node, info.property)) {
    return false
  }

  return normalizeValue(node.properties[info.property], info) === query.value
}

// `[attr~=value]`
function spaceSeparatedList(query, node, info) {
  var val

  if (!has(node, info.property)) {
    return false
  }

  val = node.properties[info.property]

  // If this is a comma-separated list, and the query is contained in it, return
  // true.
  if (
    typeof val === 'object' &&
    !info.commaSeparated &&
    val.indexOf(query.value) !== -1
  ) {
    return true
  }

  // For all other values (including comma-separated lists), return whether this
  // is an exact match.
  return normalizeValue(val, info) === query.value
}

// `[attr|=value]`
function exactOrPrefix(query, node, info) {
  var value

  if (!has(node, info.property)) {
    return false
  }

  value = normalizeValue(node.properties[info.property], info)

  return Boolean(
    value === query.value ||
      (value.slice(0, query.value.length) === query.value &&
        value.charAt(query.value.length) === '-')
  )
}

// `[attr^=value]`
function begins(query, node, info) {
  var value

  if (!has(node, info.property)) {
    return false
  }

  value = normalizeValue(node.properties[info.property], info)

  return value.slice(0, query.value.length) === query.value
}

// `[attr$=value]`
function ends(query, node, info) {
  if (!has(node, info.property)) {
    return false
  }

  return (
    normalizeValue(node.properties[info.property], info).slice(
      -query.value.length
    ) === query.value
  )
}

// `[attr*=value]`
function contains(query, node, info) {
  if (!has(node, info.property)) {
    return false
  }

  return (
    normalizeValue(node.properties[info.property], info).indexOf(
      query.value
    ) !== -1
  )
}

/* istanbul ignore next - Shouldn’t be invoked, Parser throws an error instead. */
function unknownOperator(query) {
  throw new Error('Unknown operator `' + query.operator + '`')
}

// Stringify a hast value back to its HTML form.
function normalizeValue(value, info) {
  if (typeof value === 'number') {
    value = String(value)
  } else if (typeof value === 'boolean') {
    value = info.attribute
  } else if (typeof value === 'object' && 'length' in value) {
    value = (info.commaSeparated ? commaSeparated : spaceSeparated)(value)
  }

  return value
}
