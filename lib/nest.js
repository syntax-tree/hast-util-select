'use strict'

module.exports = match

var zwitch = require('zwitch')
var enter = require('./enter-state')

var own = {}.hasOwnProperty

var handle = zwitch('nestingOperator', {
  unknown: unknownNesting,
  invalid: topScan, // `undefined` is the top query selector.
  handlers: {
    null: descendant, // `null` is the descendant combinator.
    '>': child,
    '+': nextSibling,
    '~': subsequentSibling
  }
})

function match(query, node, index, parent, state) {
  return handle(query, node, index, parent, state)
}

/* istanbul ignore next - Shouldn’t be invoked, parser gives correct data. */
function unknownNesting(query) {
  throw new Error('Unexpected nesting `' + query.nestingOperator + '`')
}

function topScan(query, node, index, parent, state) {
  /* istanbul ignore if - Shouldn’t happen. */
  if (parent) {
    throw new Error('topScan is supposed to be called from the root node')
  }

  state.iterator.apply(null, arguments)

  if (!state.shallow) descendant.apply(null, arguments)
}

function descendant(query, node, index, parent, state) {
  var previous = state.iterator

  state.iterator = iterator

  child.apply(this, arguments)

  function iterator(_, node, index, parent, state) {
    state.iterator = previous
    previous.apply(this, arguments)
    state.iterator = iterator

    if (state.one && state.found) return

    child.call(this, query, node, index, parent, state)
  }
}

function child(query, node, index, parent, state) {
  if (!node.children || !node.children.length) return
  indexedSearch(query, node, state)
}

function nextSibling(query, node, index, parent, state) {
  /* istanbul ignore if - Shouldn’t happen. */
  if (!parent) return
  indexedSearch(query, parent, state, index + 1, true)
}

function subsequentSibling(query, node, index, parent, state) {
  /* istanbul ignore if - Shouldn’t happen. */
  if (!parent) return

  indexedSearch(query, parent, state, index + 1)
}

// Handles `typeIndex` and `typeCount` properties for every walker.
function indexedSearch(query, parent, state, from, firstElementOnly) {
  var handle = state.index ? delay : add
  var children = parent.children
  var types = {}
  var delayed = []
  var elements = 0
  var index = -1

  // Start looking at `from`
  if (from == null) from = 0

  // Exit if there are no further nodes.
  if (from >= children.length) return

  // If we need to index for types, do so for all elements before `from`.
  if (state.index) {
    while (++index < from) {
      if (children[index].type === 'element') count(children[index].tagName)
    }
  }

  index = from - 1

  while (++index < children.length) {
    // Only check elements.
    // Check either all elements, or only check the first sibling
    if (children[index].type === 'element') {
      handle(children[index], index)

      // Stop if we’re looking for one node and it’s already found.
      if (state.one && state.found) return
      if (firstElementOnly) break
    }
  }

  if (state.index) {
    index = -1

    while (++index < delayed.length) {
      delayed[index]()
      if (state.one && state.found) return
    }
  }

  function delay(node, childIndex) {
    var elementsBefore = elements
    var elementsByTypeBefore = own.call(types, node.tagName)
      ? types[node.tagName]
      : 0

    count(node.tagName)

    delayed.push(fn)

    function fn() {
      // Before counting further elements:
      state.elementIndex = elementsBefore
      state.typeIndex = elementsByTypeBefore

      // After counting all elements.
      state.elementCount = elements
      state.typeCount = types[node.tagName]

      add(node, childIndex)
    }
  }

  function add(node, childIndex) {
    var exit = enter(state, node)
    state.iterator(query, node, childIndex, parent, state)
    exit()
  }

  function count(name) {
    if (!own.call(types, name)) types[name] = 0
    elements++
    types[name]++
  }
}
