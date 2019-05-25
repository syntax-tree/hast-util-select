'use strict'

module.exports = match

var zwitch = require('zwitch')
var html = require('property-information/html')
var svg = require('property-information/svg')
var needsIndex = require('./pseudo').needsIndex
var test = require('./test')
var nest = require('./nest')
var enter = require('./enter-state')

var type = zwitch('type')
var handlers = type.handlers

type.unknown = unknownType
type.invalid = invalidType
handlers.selectors = selectors
handlers.ruleSet = ruleSet
handlers.rule = rule

function match(query, node, state) {
  return query && node ? type(query, node, state) : []
}

function selectors(query, node, state) {
  var collect = collector(state.one)
  var ruleSets = query.selectors
  var length = ruleSets.length
  var index = -1

  while (++index < length) {
    collect(ruleSet(ruleSets[index], node, state))
  }

  return collect.result
}

function ruleSet(query, node, state) {
  return rule(query.rule, node, state)
}

function rule(query, tree, state) {
  var collect = collector(state.one)
  var opts = {
    schema: state.space === 'svg' ? svg : html,
    language: undefined,
    direction: 'ltr',
    editableOrEditingHost: false,
    scopeElements: tree.type === 'root' ? tree.children : [tree],
    iterator: match,
    one: state.one,
    shallow: state.shallow
  }

  if (state.shallow && query.rule) {
    throw new Error('Expected selector without nesting')
  }

  nest(query, tree, 0, null, configure(query, opts))

  return collect.result

  function match(query, node, index, parent, state) {
    var exit = enter(state, node)

    if (test(query, node, index, parent, state)) {
      if (query.rule) {
        nest(query.rule, node, index, parent, configure(query.rule, state))
      } else {
        collect(node)
        state.found = true
      }
    }

    exit()
  }

  function configure(query, state) {
    var pseudos = query.pseudos
    var length = pseudos && pseudos.length
    var index = -1

    while (++index < length) {
      if (needsIndex.indexOf(pseudos[index].name) !== -1) {
        state.index = true
        break
      }
    }

    return state
  }
}

/* istanbul ignore next - Shouldn’t be invoked, all data is handled. */
function unknownType(query) {
  throw new Error('Unknown type `' + query.type + '`')
}

/* istanbul ignore next - Shouldn’t be invoked, parser gives correct data. */
function invalidType() {
  throw new Error('Invalid type')
}

function collector(one) {
  var result = []
  var found

  collect.result = result

  return collect

  // Append elements to array, filtering out duplicates.
  function collect(source) {
    if ('length' in source) {
      collectAll()
    } else {
      collectOne(source)
    }

    function collectAll() {
      var length = source.length
      var index = -1

      while (++index < length) {
        collectOne(source[index])
      }
    }

    function collectOne(element) {
      if (one) {
        /* istanbul ignore if - shouldn’t happen, safeguards performance problems. */
        if (found) {
          throw new Error('Cannot collect multiple nodes')
        }

        found = true
      }

      if (result.indexOf(element) === -1) {
        result.push(element)
      }
    }
  }
}
