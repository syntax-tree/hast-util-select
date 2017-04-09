'use strict';

module.exports = match;

var camelcase = require('camelcase');
var zwitch = require('zwitch');
var has = require('hast-util-has-property');
var information = require('property-information');
var spaceSeparated = require('space-separated-tokens');
var commaSeparated = require('comma-separated-tokens');

var handle = zwitch('operator');
var handlers = handle.handlers;

match.support = ['~', '|', '^', '$', '*'];

handle.unknown = unknownOperator;
handle.invalid = exists;
handlers['='] = exact;
handlers['~='] = spaceSeparatedList;
handlers['|='] = exactOrPrefix;
handlers['^='] = begins;
handlers['$='] = ends;
handlers['*='] = contains;

function match(query, node) {
  var attrs = query.attrs;
  var length = attrs.length;
  var index = -1;
  var info;
  var attr;

  while (++index < length) {
    attr = attrs[index];
    info = information(attr.name) || {};
    attr.propertyName = info.propertyName || camelcase(attr.name);

    if (!handle(attr, node, info)) {
      return false;
    }
  }

  return true;
}

/* [attr] */
function exists(query, node) {
  return has(node, query.propertyName);
}

/* [attr=value] */
function exact(query, node, info) {
  if (!has(node, query.propertyName)) {
    return false;
  }

  return normalizeValue(node.properties[query.propertyName], info) === query.value;
}

/* [attr~=value] */
function spaceSeparatedList(query, node, info) {
  var val;

  if (!has(node, query.propertyName)) {
    return false;
  }

  val = node.properties[query.propertyName];

  /* If this is a comma-separated list, and the query is contained in it,
   * return true. */
  if (
    typeof val === 'object' &&
    !info.commaSeparated &&
    val.indexOf(query.value) !== -1
  ) {
    return true;
  }

  /* For all other values (including comma-separated lists),
   * return whether this is an exact match. */
  return normalizeValue(val, info) === query.value;
}

/* [attr|=value] */
function exactOrPrefix(query, node, info) {
  var value;

  if (!has(node, query.propertyName)) {
    return false;
  }

  value = normalizeValue(node.properties[query.propertyName], info);

  return Boolean(
    value === query.value ||
    (
      value.slice(0, query.value.length) === query.value &&
      value.charAt(query.value.length) === '-'
    )
  );
}

/* [attr^=value] */
function begins(query, node, info) {
  if (!has(node, query.propertyName)) {
    return false;
  }

  return normalizeValue(node.properties[query.propertyName], info)
    .slice(0, query.value.length) === query.value;
}

/* [attr$=value] */
function ends(query, node, info) {
  if (!has(node, query.propertyName)) {
    return false;
  }

  return normalizeValue(node.properties[query.propertyName], info)
    .slice(-query.value.length) === query.value;
}

/* [attr*=value] */
function contains(query, node, info) {
  if (!has(node, query.propertyName)) {
    return false;
  }

  return normalizeValue(node.properties[query.propertyName], info)
    .indexOf(query.value) !== -1;
}

/* istanbul ignore next - Shouldn’t be invoked, Parser throws an error instead. */
function unknownOperator(query) {
  throw new Error('Unknown operator `' + query.operator + '`');
}

/* Stringify a HAST value back to its HTML form. */
function normalizeValue(value, info) {
  if (info.commaSeparated) {
    value = commaSeparated.stringify(value);
  } else if (info.spaceSeparated) {
    value = spaceSeparated.stringify(value);
  } else if (info.boolean) {
    /* `false` is ignored by `has()`. */
    value = info.name;
  } else if (info.overloadedBoolean) {
    if (value === true) {
      value = info.name;
    }
  } else if (info.positiveNumeric || info.numeric) {
    value = String(value);
  }

  return value;
}
