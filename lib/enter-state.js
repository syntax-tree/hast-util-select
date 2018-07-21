'use strict'

var svg = require('property-information/svg')

module.exports = config

function config(state, node) {
  var schema = state.schema
  var language = state.language
  var found
  var lang

  if (node.type === 'element') {
    if (schema.space === 'html' && node.tagName === 'svg') {
      state.schema = svg
      found = true
    }

    lang = node.properties.xmlLang || node.properties.lang

    if (lang !== undefined && lang !== null) {
      state.language = lang
      found = true
    }
  }

  return found ? reset : noop

  function reset() {
    state.schema = schema
    state.language = language
  }
}

function noop() {}
