import {html, svg} from 'property-information'
import {zwitch} from 'zwitch'
import {enterState} from './enter-state.js'
import {nest} from './nest.js'
import {pseudo} from './pseudo.js'
import {test} from './test.js'

var type = zwitch('type', {
  unknown: unknownType,
  invalid: invalidType,
  handlers: {selectors, ruleSet, rule}
})

export function any(query, node, state) {
  return query && node ? type(query, node, state) : []
}

function selectors(query, node, state) {
  var collect = collector(state.one)
  var index = -1

  while (++index < query.selectors.length) {
    collect(ruleSet(query.selectors[index], node, state))
  }

  return collect.result
}

function ruleSet(query, node, state) {
  return rule(query.rule, node, state)
}

function rule(query, tree, state) {
  var collect = collector(state.one)

  if (state.shallow && query.rule) {
    throw new Error('Expected selector without nesting')
  }

  nest(
    query,
    tree,
    0,
    null,
    configure(query, {
      schema: state.space === 'svg' ? svg : html,
      language: null,
      direction: 'ltr',
      editableOrEditingHost: false,
      scopeElements: tree.type === 'root' ? tree.children : [tree],
      iterator,
      one: state.one,
      shallow: state.shallow
    })
  )

  return collect.result

  function iterator(query, node, index, parent, state) {
    var exit = enterState(state, node)

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
    var pseudos = query.pseudos || []
    var index = -1

    while (++index < pseudos.length) {
      if (pseudo.needsIndex.includes(pseudos[index].name)) {
        state.index = true
        break
      }
    }

    return state
  }
}

// Shouldn’t be called, all data is handled.
/* c8 ignore next 3 */
function unknownType(query) {
  throw new Error('Unknown type `' + query.type + '`')
}

// Shouldn’t be called, parser gives correct data.
/* c8 ignore next 3 */
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
    var index = -1

    if ('length' in source) {
      while (++index < source.length) {
        collectOne(source[index])
      }
    } else {
      collectOne(source)
    }

    function collectOne(element) {
      if (one) {
        // Shouldn’t happen, safeguards performance problems.
        /* c8 ignore next */
        if (found) throw new Error('Cannot collect multiple nodes')
        found = true
      }

      if (!result.includes(element)) result.push(element)
    }
  }
}
