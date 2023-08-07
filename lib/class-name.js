/**
 * @typedef {import('css-selector-parser').AstRule} AstRule
 * @typedef {import('hast').Element} Element
 */

/** @type {Array<never>} */
const emptyClassNames = []

/**
 * Check whether an element has all class names.
 *
 * @param {AstRule} query
 *   AST rule (with `classNames`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
export function className(query, element) {
  // Assume array.
  const value = /** @type {Readonly<Array<string>>} */ (
    element.properties.className || emptyClassNames
  )
  let index = -1

  if (query.classNames) {
    while (++index < query.classNames.length) {
      if (!value.includes(query.classNames[index])) return false
    }
  }

  return true
}
