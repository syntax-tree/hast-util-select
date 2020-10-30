'use strict'

module.exports = test

var attributes = require('./attribute')
var classNames = require('./class-name')
var id = require('./id')
var name = require('./name')
var pseudos = require('./pseudo')

function test(query, node, index, parent, state) {
  return (
    node &&
    node.type === 'element' &&
    (!query.tagName || name(query, node)) &&
    (!query.classNames || classNames(query, node)) &&
    (!query.id || id(query, node)) &&
    (!query.attrs || attributes(query, node, state.schema)) &&
    (!query.pseudos || pseudos(query, node, index, parent, state))
  )
}
