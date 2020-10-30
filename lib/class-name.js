'use strict'

module.exports = match

function match(query, node) {
  var value = node.properties.className || []
  var index = -1

  while (++index < query.classNames.length) {
    if (value.indexOf(query.classNames[index]) < 0) return
  }

  return true
}
