/**
 * @typedef {import('css-selector-parser').AstRule} AstRule
 * @typedef {import('hast').Element} Element
 */

// Make VS Code see references to the above types.
''

/**
 * Check whether an element has all class names.
 *
 * @param {AstRule} query
 * @param {Element} element
 * @returns {boolean}
 */
export function className(query, element) {
  /** @type {Readonly<Array<string>>} */
  // @ts-expect-error Assume array.
  const value = element.properties.className || []
  let index = -1

  if (query.classNames) {
    while (++index < query.classNames.length) {
      if (!value.includes(query.classNames[index])) return false
    }
  }

  return true
}
