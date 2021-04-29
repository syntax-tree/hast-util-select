/**
 * @typedef {import('./types.js').Rule} Rule
 * @typedef {import('./types.js').Element} Element
 */

/**
 * @param {Rule} query
 * @param {Element} element
 * @returns {boolean}
 */
export function className(query, element) {
  /** @type {Array.<string>} */
  // @ts-ignore Assume array.
  var value = element.properties.className || []
  var index = -1

  while (++index < query.classNames.length) {
    if (!value.includes(query.classNames[index])) return
  }

  return true
}
