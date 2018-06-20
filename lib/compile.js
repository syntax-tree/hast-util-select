'use strict'

var zwitch = require('zwitch')
var nthCheck = require('nth-check')

module.exports = zwitch('type')

var compile = module.exports
var handlers = compile.handlers

var nth = ['nth-child', 'nth-last-child', 'nth-of-type', 'nth-last-of-type']

handlers.selectors = selectors
handlers.ruleSet = ruleSet
handlers.rule = rule

function selectors(query) {
  var selectors = query.selectors
  var length = selectors.length
  var index = -1

  while (++index < length) {
    compile(selectors[index])
  }

  return query
}

function ruleSet(query) {
  return rule(query.rule)
}

function rule(query) {
  var pseudos = query.pseudos
  var length = pseudos && pseudos.length
  var index = -1
  var pseudo

  while (++index < length) {
    pseudo = pseudos[index]

    if (nth.indexOf(pseudo.name) !== -1) {
      pseudo.value = nthCheck(pseudo.value)
      pseudo.valueType = 'function'
    }
  }

  compile(query.rule)

  return query
}
