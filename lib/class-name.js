'use strict'

module.exports = match

function match(query, node) {
  var prop = node.properties.className || []
  var classNames = query.classNames
  var length = classNames.length
  var index = -1

  while (++index < length) {
    if (prop.indexOf(classNames[index]) === -1) {
      return false
    }
  }

  return true
}
