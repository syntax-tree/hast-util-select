export function className(query, node) {
  var value = node.properties.className || []
  var index = -1

  while (++index < query.classNames.length) {
    if (!value.includes(query.classNames[index])) return
  }

  return true
}
