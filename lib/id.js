'use strict'

module.exports = match

function match(query, node) {
  return node.properties.id === query.id
}
