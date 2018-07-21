'use strict'

/* eslint-disable complexity */

var svg = require('property-information/svg')
var direction = require('direction')
var visit = require('unist-util-visit')
var toString = require('hast-util-to-string')
var is = require('hast-util-is-element')

var ltr = 'ltr'
var rtl = 'rtl'
var auto = 'auto'
var valueTypes = ['text', 'search', 'tel', 'url', 'email']
var validDirections = [ltr, rtl, auto]
var ignoreElements = ['bdi', 'script', 'style', 'textare']

module.exports = config

function config(state, node) {
  var schema = state.schema
  var language = state.language
  var currentDirection = state.direction
  var space = schema.space
  var props = node.properties
  var dirInferred
  var type
  var found
  var lang
  var dir

  if (node.type === 'element') {
    lang = props.xmlLang || props.lang
    type = props.type || 'text'
    dir = dirProperty(node)

    if (lang !== undefined && lang !== null) {
      state.language = lang
      found = true
    }

    if (space === 'html') {
      if (is(node, 'svg')) {
        state.schema = svg
        space = 'svg'
        found = true
      }

      // Explicit `[dir=rtl]`
      if (dir === rtl) {
        dirInferred = dir
      } else if (
        // Explicit `[dir=ltr]`
        dir === ltr ||
        // HTML with an invalid or no `[dir]`
        (dir !== auto && is(node, 'html')) ||
        // `input[type=tel]` with an invalid or no `[dir]`
        (dir !== auto && is(node, 'input') && props.type === 'tel')
      ) {
        dirInferred = ltr
        // `[dir=auto]` or `bdi` with an invalid or no `[dir]`
      } else if (dir === auto || is(node, 'bdi')) {
        if (is(node, 'textarea')) {
          // Check contents of textarea
          dirInferred = dirBidi(toString(node))
        } else if (is(node, 'input') && valueTypes.indexOf(type) !== -1) {
          // Check value of input
          dirInferred = props.value ? dirBidi(props.value) : ltr
        } else {
          // Check text nodes in `node`
          visit(node, inferDirectionality)
        }
      }

      if (dirInferred) {
        state.direction = dirInferred
        found = true
      }
    }
  }

  return found ? reset : noop

  function reset() {
    state.schema = schema
    state.language = language
    state.direction = currentDirection
  }

  function inferDirectionality(child) {
    if (child.type === 'text') {
      dirInferred = dirBidi(child.value)
      return dirInferred ? visit.EXIT : null
    }

    if (child !== node && (is(child, ignoreElements) || dirProperty(child))) {
      return visit.SKIP
    }
  }
}

function dirBidi(value) {
  var val = direction(value)
  return val === 'neutral' ? null : val
}

function dirProperty(node) {
  var val = node.properties.dir
  val = typeof val === 'string' ? val.toLowerCase() : null
  return validDirections.indexOf(val) === -1 ? null : val
}

function noop() {}
