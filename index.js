'use strict'

exports.matches = matches
exports.selectAll = selectAll
exports.select = select

var any = require('./lib/any')
var parse = require('./lib/parse')

function matches(selector, node, space) {
  return Boolean(
    any(parse(selector), node, {space: space, one: true, shallow: true})[0]
  )
}

function select(selector, node, space) {
  return any(parse(selector), node, {space: space, one: true})[0] || null
}

function selectAll(selector, node, space) {
  return any(parse(selector), node, {space: space})
}
