'use strict'

module.exports = test

var name = require('./name')
var attributes = require('./attribute')
var pseudos = require('./pseudo')
var classNames = require('./class-name')
var id = require('./id')

function test(query, node, index, parent, state) {
  return Boolean(
    node &&
      node.type === 'element' &&
      (!query.tagName || name(query, node)) &&
      (!query.classNames || classNames(query, node)) &&
      (!query.id || id(query, node)) &&
      (!query.attrs || attributes(query, node, state.schema)) &&
      (!query.pseudos || pseudos(query, node, index, parent, state))
  )
}
