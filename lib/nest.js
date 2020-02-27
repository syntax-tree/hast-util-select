'use strict'

module.exports = match

var zwitch = require('zwitch')
var enter = require('./enter-state')

var own = {}.hasOwnProperty
var slice = [].slice

var handle = zwitch('nestingOperator')
var handlers = handle.handlers

handle.unknown = unknownNesting
handle.invalid = topScan // `undefined` is the top query selector.
handlers.null = descendant // `null` is the descendant combinator.
handlers['>'] = child
handlers['+'] = nextSibling
handlers['~'] = subsequentSibling

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

  if (!state.shallow) {
    descendant.apply(this, arguments)
  }
}

function descendant(query, node, index, parent, state) {
  var prev = state.iterator

  state.iterator = iterator

  child.apply(this, arguments)

  function iterator() {
    state.iterator = prev
    prev.apply(this, arguments)
    state.iterator = iterator

    if (state.one && state.found) {
      return
    }

    child.apply(this, [query].concat(slice.call(arguments, 1)))
  }
}

function child(query, node, index, parent, state) {
  if (!node.children || node.children.length === 0) {
    return
  }

  indexedSearch(query, node, state)
}

function nextSibling(query, node, index, parent, state) {
  /* istanbul ignore if - Shouldn’t happen. */
  if (!parent) {
    return
  }

  indexedSearch(query, parent, state, index + 1, true)
}

function subsequentSibling(query, node, index, parent, state) {
  /* istanbul ignore if - Shouldn’t happen. */
  if (!parent) {
    return
  }

  indexedSearch(query, parent, state, index + 1)
}

// Handles `typeIndex` and `typeCount` properties for every walker.
function indexedSearch(query, parent, state, from, firstElementOnly) {
  var needsIndex = state.index
  var children = parent.children
  var length = children.length
  var delayed = []
  var index = 0
  var types = {}
  var elements = 0
  var handle = needsIndex ? delay : add
  var child

  // Start looking at `from`
  if (from === undefined) {
    from = 0
  }

  // Exit if there are no further nodes.
  if (from >= length) {
    return
  }

  // If we need to index for types, do so for all elements before `from`.
  if (needsIndex) {
    while (index < from) {
      child = children[index]

      if (child.type === 'element') {
        count(child.tagName)
      }

      index++
    }
  }

  index = from

  while (index < length) {
    child = children[index]

    // Only check elements.
    // Check either all elements, or only check the first sibling
    if (child.type === 'element') {
      handle(child, index)

      // Stop if we’re looking for one node and it’s already found.
      if (state.one && state.found) {
        return
      }

      if (firstElementOnly) {
        break
      }
    }

    index++
  }

  if (needsIndex) {
    index = -1
    length = delayed.length

    while (++index < length) {
      delayed[index]()

      // Stop if we’re looking for one node and it’s already found.
      if (state.one && state.found) {
        // To do: maybe return?
        return
      }
    }
  }

  function delay(node, childIndex) {
    var name = node.tagName
    var elementsBefore = elements
    var elementsByTypeBefore = own.call(types, name) ? types[name] : 0

    count(name)

    delayed.push(fn)

    function fn() {
      // Before counting further elements:
      state.elementIndex = elementsBefore
      state.typeIndex = elementsByTypeBefore

      // After counting all elements.
      state.elementCount = elements
      state.typeCount = types[name]

      add(node, childIndex)
    }
  }

  function add(node, childIndex) {
    var exit = enter(state, node)
    state.iterator(query, node, childIndex, parent, state)
    exit()
  }

  function count(name) {
    if (!own.call(types, name)) {
      types[name] = 0
    }

    elements++
    types[name]++
  }
}
