'use strict'

var Parser = require('css-selector-parser').CssSelectorParser
var attributes = require('./lib/attribute')
var pseudos = require('./lib/pseudo')
var any = require('./lib/any')
var nesting = require('./lib/nest')
var compile = require('./lib/compile')

var parser = new Parser()

parser.registerAttrEqualityMods.apply(parser, attributes.support)
parser.registerSelectorPseudos.apply(parser, pseudos.selectorPseudoSupport)
parser.registerNestingOperators.apply(parser, nesting.support)

exports.matches = matches
exports.selectAll = selectAll
exports.select = select

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

function parse(selector) {
  if (typeof selector !== 'string') {
    throw new Error('Expected `string` as selector, not `' + selector + '`')
  }

  return compile(parser.parse(selector))
}
