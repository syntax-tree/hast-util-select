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
  const value = element.properties.className || []
  let index = -1

  while (++index < query.classNames.length) {
    if (!value.includes(query.classNames[index])) return
  }

  return true
}
